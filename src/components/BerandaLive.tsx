'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatRupiah, formatTanggalIndonesia } from '@/lib/saldo';

export interface RingkasanPublikApiData {
  sabtu: string;
  petugas: string[];
  terkumpul: number;
  sudah_bayar: number;
  total_rumah: number;
  blok: {
    blok: string;
    sudah: number;
    total: number;
    nunggak: number;
  }[];
}

interface BerandaLiveProps {
  initialData: RingkasanPublikApiData;
}

export default function BerandaLive({ initialData }: BerandaLiveProps) {
  const [data, setData] = useState<RingkasanPublikApiData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setLastUpdated(new Date());

    // Polling setiap 30 detik sesuai Section 16.1 Dokumen Kerangka
    const interval = setInterval(async () => {
      try {
        setIsRefreshing(true);
        const res = await fetch('/api/publik/ringkasan', { cache: 'no-store' });
        if (res.ok) {
          const freshData = await res.json();
          setData(freshData);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.warn('Gagal polling ringkasan publik:', err);
      } finally {
        setIsRefreshing(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const persenSudahBayar =
    data.total_rumah > 0
      ? Math.round((data.sudah_bayar / data.total_rumah) * 100)
      : 0;

  const namaPetugas =
    data.petugas && data.petugas.length > 0
      ? data.petugas.join(' & ')
      : 'Belum diatur';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto w-full shadow-lg border-x border-slate-200">
      <main className="p-4 sm:p-5 flex-1 flex flex-col gap-5">
        {/* Header RT */}
        <header className="pt-2 pb-1 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <span
              className={`w-2 h-2 rounded-full bg-emerald-500 ${
                isRefreshing ? 'animate-ping' : 'animate-pulse'
              }`}
            ></span>
            <span>{isRefreshing ? 'Memperbarui...' : 'Pencatatan Live'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Jimpitan RT 23
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            RW 6 · Munggut Peni
          </p>
        </header>

        {/* Kartu Petugas Sabtu Ini */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Jadwal Sabtu Ini
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {formatTanggalIndonesia(data.sabtu, false)}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
              👥
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-400">Petugas Jaga</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {namaPetugas}
              </p>
            </div>
          </div>
        </section>

        {/* Ringkasan Utama: 2 Angka Besar */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 divide-x divide-slate-100">
            {/* Terkumpul */}
            <div className="pr-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Terkumpul
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
                {formatRupiah(data.terkumpul)}
              </p>
              <span className="text-xs text-slate-400 mt-1 block">
                Sabtu ini
              </span>
            </div>

            {/* Sudah Bayar */}
            <div className="pl-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Sudah Bayar
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {data.sudah_bayar}{' '}
                <span className="text-base sm:text-lg font-medium text-slate-400">
                  / {data.total_rumah}
                </span>
              </p>
              <span className="text-xs text-slate-400 mt-1 block">
                {persenSudahBayar}% rumah
              </span>
            </div>
          </div>

          {/* Bar Progres */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, persenSudahBayar))}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 font-medium px-0.5">
              <span>Progres penerimaan</span>
              <span className="font-bold text-slate-700">{persenSudahBayar}%</span>
            </div>
          </div>
        </section>

        {/* Ringkasan Per Blok */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              Ringkasan Per Blok
            </h2>
            <span className="text-xs text-slate-400">Total 3 Blok</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {data.blok.map((b) => {
              const isLunasSemua = b.nunggak === 0 && b.sudah === b.total;
              return (
                <div
                  key={b.blok}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-white font-extrabold text-base flex items-center justify-center shrink-0">
                      {b.blok}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Blok {b.blok}
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.sudah} dari {b.total} rumah bayar
                      </p>
                    </div>
                  </div>

                  <div>
                    {b.nunggak > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                        ⚠️ {b.nunggak} nunggak
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        ✓ {isLunasSemua ? 'Lengkap' : 'Lunas'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Informasi Iuran & Polling Info */}
        <div className="text-center p-3 rounded-xl bg-slate-100/70 text-slate-500 text-xs font-medium flex flex-col gap-1">
          <div>
            Iuran rutin: <span className="font-bold text-slate-700">Rp2.000</span> per rumah per Sabtu
          </div>
          {lastUpdated && (
            <div className="text-[11px] text-slate-400">
              Menyegarkan otomatis tiap 30 detik
            </div>
          )}
        </div>
      </main>

      {/* Footer dengan Tautan Petugas */}
      <footer className="p-4 border-t border-slate-200 bg-white text-center flex flex-col items-center gap-2">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-5 py-3 rounded-xl transition w-full"
        >
          🔐 Masuk untuk Petugas
        </Link>
        <p className="text-[11px] text-slate-400">
          Aplikasi Jimpitan Mandiri RT 23 RW 06 · Kelurahan Munggut
        </p>
      </footer>
    </div>
  );
}
