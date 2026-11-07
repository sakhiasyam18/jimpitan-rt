'use server';

import { createClient } from '@/lib/supabase/server';
import { gagal, sukses, terjemahkanGalat } from '@/lib/galat';
import { Hasil, WargaRow } from '@/types';
import { revalidatePath } from 'next/cache';

export async function daftarWarga(options?: { termasukNonaktif?: boolean }): Promise<Hasil<WargaRow[]>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    let query = supabase.from('warga').select('*');

    if (!options?.termasukNonaktif) {
      query = query.eq('aktif', true);
    }

    const { data, error } = await query;

    if (error) {
      const terjemahan = terjemahkanGalat(error);
      return gagal(terjemahan.kode, terjemahan.pesan);
    }

    const list = (data || []) as WargaRow[];
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

export interface SimpanWargaParams {
  id?: string;
  blok: string;
  no_rumah: string;
  nama: string;
}

export async function simpanWarga(params: SimpanWargaParams): Promise<Hasil<WargaRow>> {
  const { id, blok, no_rumah, nama } = params;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    const cleanBlok = (blok || '').trim().toUpperCase();
    const cleanNo = (no_rumah || '').trim();
    const cleanNama = (nama || '').trim().toUpperCase();

    if (!['C0', 'C1', 'C2'].includes(cleanBlok)) {
      return gagal('GALAT_UMUM', 'Blok harus salah satu dari C0, C1, atau C2.');
    }

    if (!cleanNo) {
      return gagal('GALAT_UMUM', 'Nomor rumah wajib diisi.');
    }

    if (!cleanNama) {
      return gagal('GALAT_UMUM', 'Nama warga wajib diisi.');
    }

    if (id) {
      // Ubah data
      const { data, error } = await supabase
        .from('warga')
        .update({
          blok: cleanBlok,
          no_rumah: cleanNo,
          nama: cleanNama,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        const terjemahan = terjemahkanGalat(error);
        return gagal(terjemahan.kode, terjemahan.pesan);
      }

      revalidatePath('/petugas/warga');
      revalidatePath('/petugas');
      revalidatePath('/');

      return sukses(data as WargaRow);
    } else {
      // Tambah baru
      const { data, error } = await supabase
        .from('warga')
        .insert({
          blok: cleanBlok,
          no_rumah: cleanNo,
          nama: cleanNama,
          aktif: true,
        })
        .select()
        .single();

      if (error) {
        const terjemahan = terjemahkanGalat(error);
        return gagal(terjemahan.kode, terjemahan.pesan);
      }

      revalidatePath('/petugas/warga');
      revalidatePath('/petugas');
      revalidatePath('/');

      return sukses(data as WargaRow);
    }
  } catch (err: unknown) {
    const terjemahan = terjemahkanGalat(err);
    return gagal(terjemahan.kode, terjemahan.pesan);
  }
}

export async function ubahStatusWarga(id: string, aktif: boolean): Promise<Hasil<WargaRow>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    const { data, error } = await supabase
      .from('warga')
      .update({ aktif })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      const terjemahan = terjemahkanGalat(error);
      return gagal(terjemahan.kode, terjemahan.pesan);
    }

    revalidatePath('/petugas/warga');
    revalidatePath('/petugas');
    revalidatePath('/');

    return sukses(data as WargaRow);
  } catch (err: unknown) {
    const terjemahan = terjemahkanGalat(err);
    return gagal(terjemahan.kode, terjemahan.pesan);
  }
}

export interface BarisImporWarga {
  blok: string;
  no_rumah: string;
  nama: string;
}

export interface HasilImpor {
  berhasil: number;
  gagal: number;
  rincian: string[];
}

export async function imporWargaBatch(daftar: BarisImporWarga[]): Promise<Hasil<HasilImpor>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    if (!Array.isArray(daftar) || daftar.length === 0) {
      return gagal('VALIDASI_GAGAL', 'Tidak ada data warga untuk diimpor.');
    }

    let berhasil = 0;
    let jumlahGagal = 0;
    const rincian: string[] = [];

    for (const item of daftar) {
      const cleanBlok = (item.blok || '').trim().toUpperCase();
      const cleanNo = (item.no_rumah || '').trim();
      const cleanNama = (item.nama || '').trim().toUpperCase();

      if (!['C0', 'C1', 'C2'].includes(cleanBlok)) {
        jumlahGagal++;
        rincian.push(`Blok "${cleanBlok}" tidak valid (harus C0, C1, atau C2).`);
        continue;
      }

      if (!cleanNo) {
        jumlahGagal++;
        rincian.push(`Nomor rumah tidak boleh kosong.`);
        continue;
      }

      if (!cleanNama) {
        jumlahGagal++;
        rincian.push(`Nama warga Blok ${cleanBlok} No ${cleanNo} tidak boleh kosong.`);
        continue;
      }

      const { error } = await supabase
        .from('warga')
        .upsert(
          {
            blok: cleanBlok,
            no_rumah: cleanNo,
            nama: cleanNama,
            aktif: true,
          },
          { onConflict: 'blok,no_rumah' }
        );

      if (error) {
        jumlahGagal++;
        rincian.push(`Gagal simpan Blok ${cleanBlok} No ${cleanNo}: ${error.message}`);
      } else {
        berhasil++;
      }
    }

    revalidatePath('/petugas/warga');
    revalidatePath('/petugas');
    revalidatePath('/');

    return sukses({ berhasil, gagal: jumlahGagal, rincian });
  } catch (err: unknown) {
    const terjemahan = terjemahkanGalat(err);
    return gagal(terjemahan.kode, terjemahan.pesan);
  }
}
