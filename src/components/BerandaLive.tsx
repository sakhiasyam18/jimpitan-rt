'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { RingkasanPublikResponse } from '@/types';
import { formatRupiah, formatTanggal } from '@/lib/format';
import KartuAngka from './KartuAngka';
import BarProgres from './BarProgres';
import Lencana from './Lencana';

interface BerandaLiveProps {
  initialData: RingkasanPublikResponse | null;
}

export default function BerandaLive({ initialData }: BerandaLiveProps) {
  const [data, setData] = useState<RingkasanPublikResponse | null>(initialData);
  const [gagalSegar, setGagalSegar] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const segarkan = async () => {
    // Hentikan polling jika tab tidak terlihat
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    try {
      const res = await fetch('/api/publik/ringkasan', { cache: 'no-store' });
      if (res.ok) {
        const freshData: RingkasanPublikResponse = await res.json();
        if (freshData && Array.isArray(freshData.blok) && typeof freshData.total_rumah === 'number') {
          setData(freshData);
          setGagalSegar(false);
          return;
        }
      }
      setGagalSegar(true);
    } catch (err) {
      console.warn('Gagal polling ringkasan:', err);
      setGagalSegar(true);
    }
  };

  useEffect(() => {
    intervalRef.current = setInterval(segarkan, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        segarkan();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-[480px] mx-auto w-full border-x border-slate-200">
        <main className="p-4 sm:p-5 flex-1 flex flex-col justify-center gap-6">
          <header className="text-center flex flex-col items-center">
            <h1 className="text-[26px] sm:text-[30px] font-black text-slate-950 tracking-tight">
              Jimpitan RT 23
            </h1>
            <p className="text-[15px] sm:text-[16px] font-semibold text-slate-500 mt-0.5">
              RW 6 · Munggut Peni
            </p>
          </header>

          <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col items-center text-center gap-4 shadow-xs">
            <span className="text-[32px]">⚠️</span>
            <p className="text-[18px] sm:text-[20px] font-bold leading-snug">
              Data belum bisa dimuat. Coba lagi sebentar.
            </p>
            <button
              type="button"
              onClick={segarkan}
              className="w-full min-h-[56px] px-6 py-3 bg-amber-800 hover:bg-amber-900 active:scale-[0.98] text-white rounded-xl font-bold text-[18px] cursor-pointer flex items-center justify-center transition-transform"
            >
              Coba lagi
            </button>
          </div>
        </main>

        <footer className="p-4 border-t border-slate-200 bg-white text-center flex flex-col items-center gap-1.5">
          <Link
            href="/login"
            className="text-[15px] font-bold text-blue-900 hover:text-blue-950 underline py-2 min-h-[56px] flex items-center justify-center cursor-pointer"
          >
            Masuk untuk petugas
          </Link>
          <p className="text-[14px] text-slate-400">
            Jimpitan RT 23 RW 6 · Kelurahan Munggut
          </p>
        </footer>
      </div>
    );
  }

  const teksPetugas =
    data.petugas && data.petugas.length > 0
      ? data.petugas.join(' + ')
      : 'Jadwal belum diisi';

  const tglJaga = formatTanggal(data.sabtu_jaga, 'hari');
  const tglRekap = formatTanggal(data.sabtu_rekap, 'hari');
  const isBedaTanggal = data.sabtu_rekap && data.sabtu_jaga && data.sabtu_rekap !== data.sabtu_jaga;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-[480px] mx-auto w-full border-x border-slate-200">
      <main className="p-4 sm:p-5 flex-1 flex flex-col gap-4">
        {/* 1. Judul & Subjudul */}
        <header className="pt-2 text-center flex flex-col items-center">
          <h1 className="text-[26px] sm:text-[30px] font-black text-slate-950 tracking-tight">
            Jimpitan RT 23
          </h1>
          <p className="text-[15px] sm:text-[16px] font-semibold text-slate-500 mt-0.5">
            RW 6 · Munggut Peni
          </p>
          {gagalSegar && (
            <span className="text-[14px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-bold mt-1.5">
              Gagal menyegarkan
            </span>
          )}
        </header>

        {/* 2. Kartu Petugas (Latar Biru Muda) */}
        <section className="bg-blue-50 border border-blue-200 p-4 sm:p-5 rounded-2xl flex flex-col gap-1 shadow-xs">
          <span className="text-[14px] font-bold uppercase tracking-wider text-blue-900">
            Petugas jaga, {tglJaga}
          </span>
          <p className="text-[18px] sm:text-[20px] font-black text-blue-950 mt-0.5">
            {teksPetugas}
          </p>
        </section>

        {/* 3. Dua Kartu Angka Berdampingan */}
        <section className="flex gap-3">
          <KartuAngka
            label="Terkumpul"
            nilai={formatRupiah(data.terkumpul)}
            subLabel={`Rekap ${tglRekap}`}
            warnaNilai="hijau"
          />
          <KartuAngka
            label="Sudah bayar"
            nilai={`${data.sudah_bayar} / ${data.total_rumah}`}
            subLabel={isBedaTanggal ? `Rekap ${tglRekap}` : undefined}
            warnaNilai="gelap"
          />
        </section>

        {/* 4. Bar Progres */}
        <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <BarProgres
            sudah={data.sudah_bayar}
            total={data.total_rumah}
            label="Progres warga bayar"
          />
        </section>

        {/* 5. Daftar Per Blok */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
          <h2 className="text-[15px] font-bold uppercase tracking-wider text-slate-700">
            Per blok
          </h2>

          <div className="flex flex-col gap-2.5">
            {(data.blok || []).map((b) => {
              const isSemuaSudah = b.sudah === b.total;
              const adaNunggak = b.nunggak > 0;

              return (
                <div
                  key={b.blok}
                  className="min-h-[56px] px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[18px] sm:text-[20px] font-black text-slate-900">
                      Blok {b.blok}
                    </span>
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-600">
                      {b.sudah} / {b.total}
                    </span>
                  </div>

                  <div className="shrink-0">
                    {adaNunggak ? (
                      <Lencana warna="kuning">
                        {b.nunggak} nunggak
                      </Lencana>
                    ) : isSemuaSudah ? (
                      <Lencana warna="hijau">
                        lunas
                      </Lencana>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* 6. Tautan Kecil Masuk Petugas */}
      <footer className="p-4 border-t border-slate-200 bg-white text-center flex flex-col items-center gap-1.5">
        <Link
          href="/login"
          className="text-[15px] font-bold text-blue-900 hover:text-blue-950 underline py-2 min-h-[56px] flex items-center justify-center cursor-pointer"
        >
          Masuk untuk petugas
        </Link>
        <p className="text-[14px] text-slate-400">
          Jimpitan RT 23 RW 6 · Kelurahan Munggut
        </p>
      </footer>
    </div>
  );
}
