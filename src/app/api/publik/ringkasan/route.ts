import { NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { terjemahkanGalat } from '@/lib/galat';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('ringkasan_publik');

    if (error) {
      console.error('RPC ringkasan_publik error:', error);
      const terjemahan = terjemahkanGalat(error);
      return NextResponse.json(
        { error: { kode: terjemahan.kode, pesan: terjemahan.pesan } },
        { status: 500 }
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch (err: unknown) {
    unstable_rethrow(err);
    console.error('Exception GET /api/publik/ringkasan:', err);
    return NextResponse.json(
      { error: { kode: 'GALAT_UMUM', pesan: 'Ada masalah. Coba lagi sebentar.' } },
      { status: 500 }
    );
  }
}
