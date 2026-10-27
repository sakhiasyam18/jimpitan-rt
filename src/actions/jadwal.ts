'use server';

import { createClient } from '@/lib/supabase/server';
import { gagal, sukses, terjemahkanGalat } from '@/lib/galat';
import { adalahSabtu } from '@/lib/validasi';
import { AkunPetugasRow, Hasil, JadwalRow } from '@/types';
import { revalidatePath } from 'next/cache';

export async function lihatJadwal(dari: string, sampai: string): Promise<Hasil<JadwalRow[]>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    const { data, error } = await supabase
      .from('jadwal')
      .select(`
        id,
        tanggal,
        petugas_1,
        petugas_2,
        catatan,
        w1:warga!jadwal_petugas_1_fkey ( nama ),
        w2:warga!jadwal_petugas_2_fkey ( nama )
      `)
      .gte('tanggal', dari)
      .lte('tanggal', sampai)
      .order('tanggal', { ascending: true });

    if (error) {
      // Jika foreign key name berbeda, fallback ke query dengan join standar
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('jadwal')
        .select(`
          id,
          tanggal,
          petugas_1,
          petugas_2,
          catatan,
          w1:petugas_1 ( nama ),
          w2:petugas_2 ( nama )
        `)
        .gte('tanggal', dari)
        .lte('tanggal', sampai)
        .order('tanggal', { ascending: true });

      if (fallbackErr) {
        const terjemahan = terjemahkanGalat(fallbackErr);
        return gagal(terjemahan.kode, terjemahan.pesan);
      }

      const rows = (fallbackData || []).map((j: any) => ({
        id: j.id,
        tanggal: j.tanggal,
        petugas_1: j.petugas_1,
        petugas_2: j.petugas_2,
        catatan: j.catatan,
        petugas_1_nama: j.w1?.nama || null,
        petugas_2_nama: j.w2?.nama || null,
      }));

      return sukses(rows);
    }

    const rows: JadwalRow[] = (data || []).map((j: any) => ({
      id: j.id,
      tanggal: j.tanggal,
      petugas_1: j.petugas_1,
      petugas_2: j.petugas_2,
      catatan: j.catatan,
      petugas_1_nama: j.w1?.nama || null,
      petugas_2_nama: j.w2?.nama || null,
    }));

    return sukses(rows);
  } catch (err: unknown) {
    const terjemahan = terjemahkanGalat(err);
    return gagal(terjemahan.kode, terjemahan.pesan);
  }
}

export interface AturJadwalParams {
  tanggal: string;
  petugas_1: string | null;
  petugas_2: string | null;
  catatan?: string | null;
}

export async function aturJadwal(params: AturJadwalParams): Promise<Hasil<null>> {
  const { tanggal, petugas_1, petugas_2, catatan } = params;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    if (!adalahSabtu(tanggal)) {
      return gagal('SABTU_SALAH', 'Tanggal harus hari Sabtu.');
    }

    if (petugas_1 && petugas_2 && petugas_1 === petugas_2) {
      return gagal('PETUGAS_SAMA', 'Dua petugas harus orang berbeda.');
    }

    const { error } = await supabase
      .from('jadwal')
      .upsert(
        {
          tanggal,
          petugas_1,
          petugas_2,
          catatan: catatan || null,
        },
        {
          onConflict: 'tanggal',
        }
      );

    if (error) {
      const terjemahan = terjemahkanGalat(error);
      return gagal(terjemahan.kode, terjemahan.pesan);
    }

    revalidatePath('/petugas/jadwal');
    revalidatePath('/');

    return sukses(null);
  } catch (err: unknown) {
    const terjemahan = terjemahkanGalat(err);
    return gagal(terjemahan.kode, terjemahan.pesan);
  }
}

export interface IsiJadwalOtomatisParams {
  tanggal_mulai: string;
  jumlah_minggu: number;
}

export async function isiJadwalOtomatis(params: IsiJadwalOtomatisParams): Promise<Hasil<{ jumlah_diisi: number }>> {
  const { tanggal_mulai, jumlah_minggu } = params;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    if (!adalahSabtu(tanggal_mulai)) {
      return gagal('SABTU_SALAH', 'Tanggal harus hari Sabtu.');
    }

    if (jumlah_minggu < 1 || jumlah_minggu > 12) {
      return gagal('GALAT_UMUM', 'Jumlah minggu otomatis maksimal 12 minggu.');
    }

    // Ambil daftar petugas aktif dari akun_petugas urut nama
    const { data: petugasList, error: pErr } = await supabase
      .from('akun_petugas')
      .select('warga_id, nama')
      .eq('aktif', true)
      .not('warga_id', 'is', null)
      .order('nama', { ascending: true });

    if (pErr) {
      const terjemahan = terjemahkanGalat(pErr);
      return gagal(terjemahan.kode, terjemahan.pesan);
    }

    if (!petugasList || petugasList.length < 2) {
      return gagal('PETUGAS_KURANG', 'Petugas aktif belum cukup.');
    }

    // Hitung tanggal-tanggal Sabtu yang akan diisi
    const [startY, startM, startD] = tanggal_mulai.split('-').map(Number);
    const startDate = new Date(Date.UTC(startY, startM - 1, startD, 12, 0, 0));

    const tanggalList: string[] = [];
    for (let i = 0; i < jumlah_minggu; i++) {
      const d = new Date(startDate);
      d.setUTCDate(d.getUTCDate() + i * 7);
      const iso = d.toISOString().split('T')[0];
      tanggalList.push(iso);
    }

    // Ambil jadwal yang sudah ada dalam rentang ini untuk DILEWATI
    const { data: existingJadwal, error: existErr } = await supabase
      .from('jadwal')
      .select('tanggal')
      .in('tanggal', tanggalList);

    if (existErr) {
      const terjemahan = terjemahkanGalat(existErr);
      return gagal(terjemahan.kode, terjemahan.pesan);
    }

    const existingSet = new Set((existingJadwal || []).map((j) => j.tanggal));

    // Bentuk pasangan berurutan memutar
    const rowsToInsert = [];
    let pIdx = 0;

    for (const tgl of tanggalList) {
      // Lewati Sabtu yang sudah ada isinya
      if (existingSet.has(tgl)) {
        continue;
      }

      const p1 = petugasList[pIdx % petugasList.length].warga_id!;
      const p2 = petugasList[(pIdx + 1) % petugasList.length].warga_id!;
      pIdx = (pIdx + 2) % petugasList.length;

      rowsToInsert.push({
        tanggal: tgl,
        petugas_1: p1,
        petugas_2: p2,
        catatan: 'Jadwal putaran rutin',
      });
    }

    if (rowsToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('jadwal')
        .insert(rowsToInsert);

      if (insertErr) {
        const terjemahan = terjemahkanGalat(insertErr);
        return gagal(terjemahan.kode, terjemahan.pesan);
      }
    }

    revalidatePath('/petugas/jadwal');
    revalidatePath('/');

    return sukses({ jumlah_diisi: rowsToInsert.length });
  } catch (err: unknown) {
    const terjemahan = terjemahkanGalat(err);
    return gagal(terjemahan.kode, terjemahan.pesan);
  }
}

export async function daftarPetugasAktif(): Promise<Hasil<AkunPetugasRow[]>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return gagal('BELUM_MASUK', 'Silakan masuk dulu.');
    }

    const { data, error } = await supabase
      .from('akun_petugas')
      .select('user_id, warga_id, nama, aktif')
      .eq('aktif', true)
      .order('nama', { ascending: true });

    if (error) {
      const terjemahan = terjemahkanGalat(error);
      return gagal(terjemahan.kode, terjemahan.pesan);
    }

    return sukses((data || []) as AkunPetugasRow[]);
  } catch (err: unknown) {
    const terjemahan = terjemahkanGalat(err);
    return gagal(terjemahan.kode, terjemahan.pesan);
  }
}
