'use server';

import { createClient } from '@/lib/supabase/server';
import { gagal, sukses, terjemahkanGalat } from '@/lib/galat';
import { Hasil, PengaturanRow } from '@/types';
import { revalidatePath } from 'next/cache';

export async function lihatPengaturan(): Promise<Hasil<PengaturanRow>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    const { data, error } = await supabase
      .from('pengaturan')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      const terjemahan = terjemahkanGalat(error);
      return gagal(terjemahan.kode, terjemahan.pesan);
    }

    return sukses(data as PengaturanRow);
  } catch (err: unknown) {
    const terjemahan = terjemahkanGalat(err);
    return gagal(terjemahan.kode, terjemahan.pesan);
  }
}

export interface UbahPengaturanParams {
  iuran_per_minggu: number;
  batas_langganan_nunggak: number;
}

export async function ubahPengaturan(params: UbahPengaturanParams): Promise<Hasil<PengaturanRow>> {
  const { iuran_per_minggu, batas_langganan_nunggak } = params;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    if (typeof iuran_per_minggu !== 'number' || iuran_per_minggu <= 0) {
      return gagal('JUMLAH_TIDAK_VALID', 'Iuran harus bilangan bulat positif.');
    }

    if (typeof batas_langganan_nunggak !== 'number' || batas_langganan_nunggak < 1) {
      return gagal('GALAT_UMUM', 'Batas langganan nunggak minimal 1 minggu.');
    }

    // tanggal_mulai TIDAK BOLEH diubah dari aplikasi
    const { data, error } = await supabase
      .from('pengaturan')
      .update({
        iuran_per_minggu,
        batas_langganan_nunggak,
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      const terjemahan = terjemahkanGalat(error);
      return gagal(terjemahan.kode, terjemahan.pesan);
    }

    revalidatePath('/petugas');
    revalidatePath('/');

    return sukses(data as PengaturanRow);
  } catch (err: unknown) {
    const terjemahan = terjemahkanGalat(err);
    return gagal(terjemahan.kode, terjemahan.pesan);
  }
}
