'use server';

import { createClient } from '@/lib/supabase/server';
import { buatGalat, GalatApp } from '@/lib/galat';
import { revalidatePath } from 'next/cache';

export interface UbahPengaturanInput {
  iuran_per_minggu: number;
  batas_langganan_nunggak: number;
}

export async function ubahPengaturan(
  input: UbahPengaturanInput
): Promise<{ success: boolean; data?: unknown } | GalatApp> {
  const { iuran_per_minggu, batas_langganan_nunggak } = input;

  if (iuran_per_minggu <= 0 || !Number.isInteger(iuran_per_minggu)) {
    return buatGalat('ISIAN_TIDAK_VALID', 'Iuran per minggu harus bilangan bulat positif.');
  }

  if (batas_langganan_nunggak < 1 || !Number.isInteger(batas_langganan_nunggak)) {
    return buatGalat('ISIAN_TIDAK_VALID', 'Batas langganan nunggak minimal 1 minggu.');
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return buatGalat('BELUM_LOGIN', 'Silakan masuk terlebih dahulu.');
    }

    const { data, error } = await supabase
      .from('pengaturan')
      .update({
        iuran_per_minggu,
        batas_langganan_nunggak,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      return buatGalat('GAGAL_SERVER', 'Gagal menyimpan pengaturan: ' + error.message);
    }

    revalidatePath('/petugas');
    revalidatePath('/');

    return { success: true, data };
  } catch (err: unknown) {
    console.error('Exception ubahPengaturan:', err);
    return buatGalat('GAGAL_SERVER', 'Terjadi kesalahan sistem.');
  }
}
