'use server';

import { createClient } from '@/lib/supabase/server';
import { validasiHariSabtu, validasiPetugasJadwal } from '@/lib/validasi';
import { buatGalat, GalatApp } from '@/lib/galat';
import { revalidatePath } from 'next/cache';

export interface AturJadwalInput {
  tanggal: string; // YYYY-MM-DD
  petugas_1: string | null;
  petugas_2: string | null;
  catatan?: string | null;
}

export async function aturJadwal(
  input: AturJadwalInput
): Promise<{ success: boolean; data?: unknown } | GalatApp> {
  const { tanggal, petugas_1, petugas_2, catatan } = input;

  const galatSabtu = validasiHariSabtu(tanggal);
  if (galatSabtu) return galatSabtu;

  const galatPetugas = validasiPetugasJadwal(petugas_1, petugas_2);
  if (galatPetugas) return galatPetugas;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return buatGalat('BELUM_LOGIN', 'Silakan masuk terlebih dahulu.');
    }

    const { data, error } = await supabase
      .from('jadwal')
      .upsert(
        {
          tanggal,
          petugas_1: petugas_1 || null,
          petugas_2: petugas_2 || null,
          catatan: catatan || null,
        },
        {
          onConflict: 'tanggal',
        }
      )
      .select()
      .single();

    if (error) {
      return buatGalat('GAGAL_SERVER', 'Gagal menyimpan jadwal: ' + error.message);
    }

    revalidatePath('/petugas/jadwal');
    revalidatePath('/');

    return { success: true, data };
  } catch (err: unknown) {
    console.error('Exception aturJadwal:', err);
    return buatGalat('GAGAL_SERVER', 'Terjadi kesalahan sistem saat menyimpan jadwal.');
  }
}

export async function isiJadwalOtomatis(input: {
  tanggal_mulai: string;
  jumlah_minggu: number;
}): Promise<{ success: boolean; jumlahDiisi: number } | GalatApp> {
  const { tanggal_mulai, jumlah_minggu } = input;

  const galatSabtu = validasiHariSabtu(tanggal_mulai);
  if (galatSabtu) return galatSabtu;

  if (jumlah_minggu < 1 || jumlah_minggu > 52) {
    return buatGalat('ISIAN_TIDAK_VALID', 'Jumlah minggu harus antara 1 sampai 52.');
  }

  try {
    const supabase = await createClient();

    // Ambil daftar petugas/warga aktif
    const { data: wargaList } = await supabase
      .from('warga')
      .select('id')
      .eq('aktif', true)
      .order('blok')
      .order('no_rumah');

    if (!wargaList || wargaList.length < 2) {
      return buatGalat('ISIAN_TIDAK_VALID', 'Dibutuhkan minimal 2 warga aktif untuk membuat jadwal bergilir.');
    }

    const cur = new Date(tanggal_mulai);
    const rowsToUpsert = [];
    let pIdx = 0;

    for (let i = 0; i < jumlah_minggu; i++) {
      const d = new Date(cur);
      d.setDate(d.getDate() + i * 7);
      const tglStr = d.toISOString().split('T')[0];

      const p1 = wargaList[pIdx % wargaList.length].id;
      const p2 = wargaList[(pIdx + 1) % wargaList.length].id;
      pIdx = (pIdx + 2) % wargaList.length;

      rowsToUpsert.push({
        tanggal: tglStr,
        petugas_1: p1,
        petugas_2: p2,
        catatan: 'Jadwal putaran rutin',
      });
    }

    const { error } = await supabase
      .from('jadwal')
      .upsert(rowsToUpsert, { onConflict: 'tanggal' });

    if (error) {
      return buatGalat('GAGAL_SERVER', 'Gagal mengisi jadwal otomatis: ' + error.message);
    }

    revalidatePath('/petugas/jadwal');
    revalidatePath('/');

    return { success: true, jumlahDiisi: rowsToUpsert.length };
  } catch (err: unknown) {
    console.error('Exception isiJadwalOtomatis:', err);
    return buatGalat('GAGAL_SERVER', 'Terjadi kesalahan sistem.');
  }
}
