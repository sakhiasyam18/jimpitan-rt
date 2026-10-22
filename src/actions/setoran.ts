'use server';

import { createClient } from '@/lib/supabase/server';
import { validasiHariSabtu, validasiJumlahSetoran } from '@/lib/validasi';
import { buatGalat, GalatApp } from '@/lib/galat';
import { revalidatePath } from 'next/cache';

export interface SimpanSetoranInput {
  warga_id: string;
  tanggal: string; // YYYY-MM-DD
  jumlah: number;
}

export async function simpanSetoran(
  input: SimpanSetoranInput
): Promise<{ success: boolean; data?: unknown } | GalatApp> {
  const { warga_id, tanggal, jumlah } = input;

  // 1. Validasi input dasar
  const galatSabtu = validasiHariSabtu(tanggal);
  if (galatSabtu) return galatSabtu;

  const galatJumlah = validasiJumlahSetoran(jumlah);
  if (galatJumlah) return galatJumlah;

  if (!warga_id) {
    return buatGalat('ISIAN_TIDAK_VALID', 'ID warga wajib disertakan.');
  }

  try {
    const supabase = await createClient();

    // 2. Periksa otentikasi petugas
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return buatGalat('BELUM_LOGIN', 'Silakan masuk terlebih dahulu.');
    }

    // 3. Pastikan rumah warga masih aktif
    const { data: warga, error: wargaErr } = await supabase
      .from('warga')
      .select('aktif')
      .eq('id', warga_id)
      .single();

    if (wargaErr || !warga) {
      return buatGalat('ISIAN_TIDAK_VALID', 'Data rumah tidak ditemukan.');
    }

    if (!warga.aktif) {
      return buatGalat('WARGA_NONAKTIF', 'Rumah sudah dinonaktifkan, tidak dapat mencatat setoran baru.');
    }

    // 4. Lakukan upsert ke tabel setoran (terakhir menimpa)
    const { data, error } = await supabase
      .from('setoran')
      .upsert(
        {
          tanggal,
          warga_id,
          jumlah,
          dicatat_oleh: user.id,
          dicatat_pada: new Date().toISOString(),
        },
        {
          onConflict: 'tanggal, warga_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error simpanSetoran:', error);
      return buatGalat('GAGAL_SERVER', 'Gagal menyimpan setoran: ' + error.message);
    }

    // Segarkan cache rute
    revalidatePath('/petugas');
    revalidatePath('/');

    return { success: true, data };
  } catch (err: unknown) {
    console.error('Exception simpanSetoran:', err);
    return buatGalat('GAGAL_SERVER', 'Terjadi kesalahan sistem saat menyimpan setoran.');
  }
}
