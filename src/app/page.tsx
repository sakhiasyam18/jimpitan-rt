import { Suspense } from 'react';
import { fetchRingkasanPublik } from '@/lib/data';
import BerandaLive from '@/components/BerandaLive';

async function BerandaContent() {
  const data = await fetchRingkasanPublik();
  return <BerandaLive initialData={data} />;
}

function BerandaSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-[480px] mx-auto w-full border-x border-slate-200 p-4">
      <div className="flex flex-col gap-4 animate-pulse mt-4">
        <div className="h-16 bg-slate-200 rounded-2xl"></div>
        <div className="h-24 bg-blue-100 rounded-2xl"></div>
        <div className="flex gap-3">
          <div className="h-28 bg-white rounded-2xl border flex-1"></div>
          <div className="h-28 bg-white rounded-2xl border flex-1"></div>
        </div>
        <div className="h-16 bg-white rounded-2xl border"></div>
        <div className="h-44 bg-white rounded-2xl border"></div>
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
