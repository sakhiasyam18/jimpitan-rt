import { Suspense } from 'react';
import { fetchRingkasanPublik } from '@/lib/data';
import BerandaLive, { RingkasanPublikApiData } from '@/components/BerandaLive';

async function BerandaContent() {
  const data = await fetchRingkasanPublik();

  const initialApiData: RingkasanPublikApiData = {
    sabtu: data.tanggal,
    petugas: [data.petugas_1, data.petugas_2].filter(
      (p) => p && p !== 'Belum diatur' && p !== '-'
    ),
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

  return <BerandaLive initialData={initialApiData} />;
}

function BerandaSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto w-full shadow-lg border-x border-slate-200 p-4">
      <div className="flex flex-col gap-5 animate-pulse mt-4">
        <div className="h-20 bg-slate-200 rounded-2xl"></div>
        <div className="h-28 bg-white rounded-2xl border border-slate-200"></div>
        <div className="h-36 bg-white rounded-2xl border border-slate-200"></div>
        <div className="h-44 bg-white rounded-2xl border border-slate-200"></div>
      </div>
    </div>
  );
}

export default function BerandaPage() {
  return (
    <Suspense fallback={<BerandaSkeleton />}>
      <BerandaContent />
    </Suspense>
  );
}
