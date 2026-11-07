'use server';

import { createClient } from '@/lib/supabase/server';
import { BATAS_JUMLAH_BESAR } from '@/lib/konstanta';
import { gagal, sukses, terjemahkanGalat } from '@/lib/galat';
import { adalahRupiahValid, adalahSabtu } from '@/lib/validasi';
import { Hasil, VSaldoWarga } from '@/types';
import { revalidatePath } from 'next/cache';

export async function daftarRumah(blok?: 'C0' | 'C1' | 'C2'): Promise<Hasil<VSaldoWarga[]>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    let query = supabase
      .from('v_saldo_warga')
      .select('*')
      .eq('aktif', true);

    if (blok) {
      query = query.eq('blok', blok);
    }

    const { data, error } = await query;

    if (error) {
      const terjemahan = terjemahkanGalat(error);
      return gagal(terjemahan.kode, terjemahan.pesan);
    }

    const list = (data || []) as VSaldoWarga[];

    // Urutkan blok, lalu no_rumah berdasarkan angka (angka nol di depan tidak mengacaukan urutan)
    list.sort((a, b) => {
      const cmpBlok = (a.blok || '').localeCompare(b.blok || '');
      if (cmpBlok !== 0) return cmpBlok;
      const numA = parseInt(a.no_rumah, 10) || 0;
      const numB = parseInt(b.no_rumah, 10) || 0;
      return numA - numB;
    });

    return sukses(list);
  } catch (err: unknown) {
    const terjemahan = terjemahkanGalat(err);
    return gagal(terjemahan.kode, terjemahan.pesan);
  }
}

export interface SimpanSetoranParams {
  warga_id: string;
  jumlah: number;
  tanggal?: string;
  konfirmasiBesar?: boolean;
}

export async function simpanSetoran(params: SimpanSetoranParams): Promise<Hasil<VSaldoWarga>> {
  const { warga_id, jumlah, tanggal, konfirmasiBesar } = params;

  try {
    const supabase = await createClient();

    // 1. Cek otorisasi user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    // 2. Tentukan tanggal (default = sabtu_terbaru dari view)
    let targetTanggal = tanggal;
    if (!targetTanggal) {
      const { data: sampleRow } = await supabase
        .from('v_saldo_warga')
        .select('sabtu_terbaru')
        .limit(1)
        .single();

      targetTanggal = sampleRow?.sabtu_terbaru;
    }

    if (!targetTanggal) {
      return gagal('SABTU_SALAH', 'Tanggal harus hari Sabtu.');
    }

    // 3. Validasi hari Sabtu
    if (!adalahSabtu(targetTanggal)) {
      return gagal('SABTU_SALAH', 'Tanggal harus hari Sabtu.');
    }

    // 4. Validasi jumlah
    if (!adalahRupiahValid(jumlah)) {
      return gagal('JUMLAH_TIDAK_VALID', 'Jumlah harus angka, nol atau lebih.');
    }

    // 5. Peringatan jumlah besar
    if (jumlah > BATAS_JUMLAH_BESAR && konfirmasiBesar !== true) {
      return gagal('JUMLAH_BESAR', 'Jumlahnya besar. Yakin?');
    }

    // 6. Simpan dengan upsert (jangan kirim dicatat_oleh atau dicatat_pada)
    const { error: upsertErr } = await supabase
      .from('setoran')
      .upsert(
        {
          tanggal: targetTanggal,
          warga_id,
          jumlah,
        },
        {
          onConflict: 'tanggal,warga_id',
        }
      );

    if (upsertErr) {
      const terjemahan = terjemahkanGalat(upsertErr);
      return gagal(terjemahan.kode, terjemahan.pesan);
    }

    revalidatePath('/petugas');

    // 7. Ambil baris rumah terbaru dari view v_saldo_warga
    const { data: updatedRumah, error: viewErr } = await supabase
      .from('v_saldo_warga')
      .select('*')
      .eq('warga_id', warga_id)
      .single();

    if (viewErr || !updatedRumah) {
      const terjemahan = terjemahkanGalat(viewErr);
      return gagal(terjemahan.kode, terjemahan.pesan);
    }

    return sukses(updatedRumah as VSaldoWarga);
  } catch (err: unknown) {
    const terjemahan = terjemahkanGalat(err);
    return gagal(terjemahan.kode, terjemahan.pesan);
  }
}

export interface BarisImporSetoran {
  tanggal: string; // Format YYYY-MM-DD (Wajib hari Sabtu)
  blok: string;
  no_rumah: string;
  jumlah: number;
}

export async function imporSetoranBatch(
  daftar: BarisImporSetoran[]
): Promise<Hasil<{ berhasil: number; gagal: number; rincian: string[] }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    if (!Array.isArray(daftar) || daftar.length === 0) {
      return gagal('VALIDASI_GAGAL', 'Tidak ada data setoran untuk diimpor.');
    }

    // Ambil data warga aktif untuk memetakan (blok, no_rumah) -> warga_id
    const { data: semuaWarga, error: wargaErr } = await supabase
      .from('warga')
      .select('id, blok, no_rumah');

    if (wargaErr || !semuaWarga) {
      const terjemahan = terjemahkanGalat(wargaErr);
      return gagal(terjemahan.kode, terjemahan.pesan);
    }

    const petaWarga = new Map<string, string>();
    for (const w of semuaWarga) {
      const kunci = `${(w.blok || '').toUpperCase()}-${(w.no_rumah || '').trim()}`;
      petaWarga.set(kunci, w.id);
    }

    let berhasil = 0;
    let jumlahGagal = 0;
    const rincian: string[] = [];

    for (const item of daftar) {
      const cleanTgl = (item.tanggal || '').trim();
      const cleanBlok = (item.blok || '').trim().toUpperCase();
      const cleanNo = (item.no_rumah || '').trim();
      const jumlah = Number(item.jumlah);

      if (!cleanTgl || !adalahSabtu(cleanTgl)) {
        jumlahGagal++;
        rincian.push(`Tanggal "${cleanTgl}" bukan hari Sabtu atau tidak valid (format: YYYY-MM-DD).`);
        continue;
      }

      if (!adalahRupiahValid(jumlah)) {
        jumlahGagal++;
        rincian.push(`Jumlah Rp${jumlah} pada Blok ${cleanBlok} No ${cleanNo} tidak valid.`);
        continue;
      }

      const kunci = `${cleanBlok}-${cleanNo}`;
      const wargaId = petaWarga.get(kunci);

      if (!wargaId) {
        jumlahGagal++;
        rincian.push(`Rumah Blok ${cleanBlok} No ${cleanNo} tidak ditemukan di sistem.`);
        continue;
      }

      const { error: upsertErr } = await supabase
        .from('setoran')
        .upsert(
          {
            tanggal: cleanTgl,
            warga_id: wargaId,
            jumlah,
          },
          {
            onConflict: 'tanggal,warga_id',
          }
        );

      if (upsertErr) {
        jumlahGagal++;
        rincian.push(`Gagal simpan Blok ${cleanBlok} No ${cleanNo}: ${upsertErr.message}`);
      } else {
        berhasil++;
      }
    }

    revalidatePath('/petugas');
    revalidatePath('/');

    return sukses({ berhasil, gagal: jumlahGagal, rincian });
  } catch (err: unknown) {
    const terjemahan = terjemahkanGalat(err);
    return gagal(terjemahan.kode, terjemahan.pesan);
  }
}
