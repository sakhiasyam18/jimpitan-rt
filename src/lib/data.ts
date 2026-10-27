import { connection } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RingkasanPublikResponse } from '@/types';

export async function fetchRingkasanPublik(): Promise<RingkasanPublikResponse | null> {
  await connection();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('ringkasan_publik');

    if (error || !data) {
      console.error('RPC ringkasan_publik error:', error?.message);
      return null;
    }

    const res = data as unknown as RingkasanPublikResponse;
    if (!Array.isArray(res.blok) || typeof res.total_rumah !== 'number') {
      console.error('Format data ringkasan_publik tidak valid:', data);
      return null;
    }

    return res;
  } catch (err) {
    unstable_rethrow(err);
    console.error('Error koneksi Supabase:', err);
    return null;
  }
}
