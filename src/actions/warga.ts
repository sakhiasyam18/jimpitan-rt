'use server';

import { createClient } from '@/lib/supabase/server';
import { buatGalat, GalatApp } from '@/lib/galat';
import { revalidatePath } from 'next/cache';

export interface SimpanWargaInput {
  id?: string;
  blok: string;
  no_rumah: string;
  nama: string;
  aktif?: boolean;
}

export async function simpanWarga(
  input: SimpanWargaInput
): Promise<{ success: boolean; data?: unknown } | GalatApp> {
  const { id, blok, no_rumah, nama, aktif = true } = input;

  const cleanBlok = blok.trim().toUpperCase();
  const cleanNo = no_rumah.trim();
  const cleanNama = nama.trim().toUpperCase();

  if (!cleanBlok || !cleanNo) {
    return buatGalat('ISIAN_TIDAK_VALID', 'Blok dan nomor rumah wajib diisi.');
  }

  if (!cleanNama) {
    return buatGalat('ISIAN_TIDAK_VALID', 'Nama warga wajib diisi.');
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return buatGalat('BELUM_LOGIN', 'Silakan masuk terlebih dahulu.');
    }

    if (id) {
      // Update
      const { data, error } = await supabase
        .from('warga')
        .update({
          blok: cleanBlok,
          no_rumah: cleanNo,
          nama: cleanNama,
          aktif,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return buatGalat('DATA_KEMBAR', `Rumah di Blok ${cleanBlok} No. ${cleanNo} sudah terdaftar.`);
        }
        return buatGalat('GAGAL_SERVER', 'Gagal memperbarui data: ' + error.message);
      }

      revalidatePath('/petugas/warga');
      revalidatePath('/petugas');
      revalidatePath('/');
      return { success: true, data };
    } else {
      // Insert baru
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
        if (error.code === '23505') {
          return buatGalat('DATA_KEMBAR', `Rumah di Blok ${cleanBlok} No. ${cleanNo} sudah terdaftar.`);
        }
        return buatGalat('GAGAL_SERVER', 'Gagal menambah warga: ' + error.message);
      }

      revalidatePath('/petugas/warga');
      revalidatePath('/petugas');
      revalidatePath('/');
      return { success: true, data };
    }
  } catch (err: unknown) {
    console.error('Exception simpanWarga:', err);
    return buatGalat('GAGAL_SERVER', 'Terjadi kesalahan sistem saat menyimpan warga.');
  }
}

export async function nonaktifkanWarga(
  wargaId: string
): Promise<{ success: boolean } | GalatApp> {
  if (!wargaId) {
    return buatGalat('ISIAN_TIDAK_VALID', 'ID warga wajib disertakan.');
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return buatGalat('BELUM_LOGIN', 'Silakan masuk terlebih dahulu.');
    }

    const { error } = await supabase
      .from('warga')
      .update({ aktif: false })
      .eq('id', wargaId);

    if (error) {
      return buatGalat('GAGAL_SERVER', 'Gagal menonaktifkan warga: ' + error.message);
    }

    revalidatePath('/petugas/warga');
    revalidatePath('/petugas');
    revalidatePath('/');

    return { success: true };
  } catch (err: unknown) {
    console.error('Exception nonaktifkanWarga:', err);
    return buatGalat('GAGAL_SERVER', 'Terjadi kesalahan sistem.');
  }
}
