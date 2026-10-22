'use server';

import { createClient } from '@/lib/supabase/server';
import { namaToInternalEmail } from '@/lib/saldo';
import { buatGalat, GalatApp } from '@/lib/galat';
import { redirect } from 'next/navigation';

export async function masuk(formData: { nama: string; pin: string }): Promise<{ success: boolean } | GalatApp> {
  const { nama, pin } = formData;
  const cleanNama = nama.trim();
  const cleanPin = pin.trim();

  if (!cleanNama) {
    return buatGalat('ISIAN_TIDAK_VALID', 'Nama petugas wajib diisi.');
  }

  if (cleanPin.length < 6) {
    return buatGalat('ISIAN_TIDAK_VALID', 'PIN harus 6 angka.');
  }

  try {
    const supabase = await createClient();
    const email = namaToInternalEmail(cleanNama);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: cleanPin,
    });

    if (error || !data.user) {
      return buatGalat('TIDAK_BERHAK', 'Nama atau PIN salah, coba lagi.');
    }

    // Periksa apakah petugas aktif di akun_petugas
    const { data: akun } = await supabase
      .from('akun_petugas')
      .select('aktif')
      .eq('user_id', data.user.id)
      .single();

    if (akun && !akun.aktif) {
      await supabase.auth.signOut();
      return buatGalat('TIDAK_BERHAK', 'Akun petugas Anda sedang dinonaktifkan.');
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error action masuk:', err);
    return buatGalat('GAGAL_SERVER', 'Terjadi kesalahan sistem saat masuk.');
  }
}

export async function keluar() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
