import { NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { fetchRingkasanPublik } from '@/lib/data';

export async function GET() {
  try {
    const data = await fetchRingkasanPublik();

    const petugasArray: string[] = [];
    if (data.petugas_1 && data.petugas_1 !== 'Belum diatur' && data.petugas_1 !== '-') {
      petugasArray.push(data.petugas_1);
    }
    if (data.petugas_2 && data.petugas_2 !== 'Belum diatur' && data.petugas_2 !== '-') {
      petugasArray.push(data.petugas_2);
    }

    const responsePayload = {
      sabtu: data.tanggal,
      petugas: petugasArray.length > 0 ? petugasArray : ['Belum diatur', 'Belum diatur'],
      terkumpul: data.total_terkumpul,
      sudah_bayar: data.sudah_bayar_count,
      total_rumah: data.total_rumah,
      blok: data.blok_ringkasan.map((b) => ({
        blok: b.blok,
        sudah: b.sudah_bayar,
        total: b.total_rumah,
        nunggak: b.nunggak,
      })),
    };

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    unstable_rethrow(err);
    console.error('Error /api/publik/ringkasan:', err);
    return NextResponse.json(
      {
        error: {
          kode: 'GAGAL_SERVER',
          pesan: 'Gagal mengambil ringkasan data publik.',
        },
      },
      { status: 500 }
    );
  }
}
