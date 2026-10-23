import { connection } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RingkasanPublikResponse } from '@/types';

export function getFallbackRingkasan(): RingkasanPublikResponse {
  return {
    sabtu_rekap: '2026-10-17',
    sabtu_jaga: '2026-10-24',
    petugas: [],
    terkumpul: 0,
    sudah_bayar: 51,
    total_rumah: 51,
    blok: [
      { blok: 'C0', total: 29, sudah: 29, nunggak: 0 },
      { blok: 'C1', total: 2, sudah: 2, nunggak: 0 },
      { blok: 'C2', total: 20, sudah: 20, nunggak: 0 },
    ],
  };
}

export async function fetchRingkasanPublik(): Promise<RingkasanPublikResponse> {
  await connection();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return getFallbackRingkasan();
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('ringkasan_publik');

    if (error || !data) {
      console.warn('Gagal memuat ringkasan publik dari Supabase, menggunakan data default:', error?.message);
      return getFallbackRingkasan();
    }

    const raw = data as any;
    const blok = Array.isArray(raw.blok)
      ? raw.blok
      : Array.isArray(raw.blok_ringkasan)
      ? raw.blok_ringkasan.map((b: any) => ({
          blok: b.blok,
          total: b.total_rumah ?? b.total ?? 0,
          sudah: b.sudah_bayar ?? b.sudah ?? 0,
          nunggak: b.nunggak ?? 0,
        }))
      : [];

    return {
      sabtu_rekap: raw.sabtu_rekap || raw.tanggal || '2026-10-17',
      sabtu_jaga: raw.sabtu_jaga || raw.tanggal || '2026-10-24',
      petugas: Array.isArray(raw.petugas)
        ? raw.petugas
        : [raw.petugas_1, raw.petugas_2].filter((p) => p && p !== 'Belum diatur' && p !== '-'),
      terkumpul: raw.terkumpul ?? raw.total_terkumpul ?? 0,
      sudah_bayar: raw.sudah_bayar ?? raw.sudah_bayar_count ?? 0,
      total_rumah: raw.total_rumah ?? 51,
      blok,
    };
  } catch (err) {
    unstable_rethrow(err);
    console.warn('Error koneksi Supabase:', err);
    return getFallbackRingkasan();
  }
}
