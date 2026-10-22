import { connection } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RingkasanPublikData } from '@/types/database';
import { getMockRingkasanPublik } from './mock-data';

export async function fetchRingkasanPublik(): Promise<RingkasanPublikData> {
  await connection();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return getMockRingkasanPublik();
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('ringkasan_publik');

    if (error || !data) {
      console.warn('Gagal memuat ringkasan publik dari Supabase, menggunakan data default:', error?.message);
      return getMockRingkasanPublik();
    }

    return data as RingkasanPublikData;
  } catch (err) {
    unstable_rethrow(err);
    console.warn('Error koneksi Supabase:', err);
    return getMockRingkasanPublik();
  }
}
