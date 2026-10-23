'use server';

import { createClient } from '@/lib/supabase/server';
import { EMAIL_DOMAIN } from '@/lib/konstanta';
import { gagal, sukses } from '@/lib/galat';
import { Hasil } from '@/types';

export async function masuk(nama: string, pin: string): Promise<Hasil<null>> {
  const cleanNama = (nama || '').trim().toLowerCase().replace(/\s+/g, '.');
  const cleanPin = (pin || '').trim();

  if (!cleanNama || !cleanPin) {
    return gagal('LOGIN_GAGAL', 'Nama atau PIN salah.');
  }

  const email = `${cleanNama}@${EMAIL_DOMAIN}`;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: cleanPin,
    });

    if (error || !data.user) {
      return gagal('LOGIN_GAGAL', 'Nama atau PIN salah.');
    }

    // Periksa status aktif di tabel akun_petugas
    const { data: akun, error: akunErr } = await supabase
      .from('akun_petugas')
      .select('aktif')
      .eq('user_id', data.user.id)
      .single();

    if (akunErr || !akun || !akun.aktif) {
      await supabase.auth.signOut();
      return gagal('TIDAK_BERHAK', 'Akun ini tidak boleh melakukan ini.');
    }

    return sukses(null);
  } catch (err: unknown) {
    console.error('Error action masuk:', err);
    return gagal('LOGIN_GAGAL', 'Nama atau PIN salah.');
  }
}

export async function keluar(): Promise<Hasil<null>> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return sukses(null);
  } catch (err: unknown) {
    console.error('Error action keluar:', err);
    return gagal('GALAT_UMUM', 'Ada masalah. Coba lagi sebentar.');
  }
}
