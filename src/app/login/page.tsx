'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { masuk } from '@/actions/auth';
import TombolBesar from '@/components/TombolBesar';
import KotakGalat from '@/components/KotakGalat';

export default function LoginPage() {
  const router = useRouter();
  const [nama, setNama] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [memuat, setMemuat] = useState<boolean>(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGalat(null);

    const cleanNama = nama.trim();
    const cleanPin = pin.trim();

    if (!cleanNama || !cleanPin) {
      setGalat('Nama atau PIN salah.');
      return;
    }

    setMemuat(true);

    const hasil = await masuk(cleanNama, cleanPin);

    setMemuat(false);

    if (hasil.ok) {
      router.push('/petugas');
    } else {
      setGalat(hasil.error.pesan || 'Nama atau PIN salah.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-[480px] mx-auto w-full border-x border-slate-200">
      {/* Tautan Kembali */}
      <div className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[15px] font-bold text-slate-600 hover:text-slate-900 min-h-[44px]"
        >
          ← Kembali ke beranda
        </Link>
      </div>

      {/* Konten Login */}
      <main className="p-4 sm:p-6 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md flex flex-col gap-5">
          <div className="text-center">
            <h1 className="text-[26px] sm:text-[30px] font-black text-slate-950 tracking-tight">
              Masuk Petugas
            </h1>
            <p className="text-[15px] text-slate-500 font-medium mt-1">
              Pencatatan jimpitan RT 23 RW 6
            </p>
          </div>

          {galat && <KotakGalat pesan={galat} />}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Input Nama */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="input-nama"
                className="text-[14px] font-bold uppercase tracking-wider text-slate-700"
              >
                Nama
              </label>
              <input
                id="input-nama"
                type="text"
                autoCapitalize="words"
                autoComplete="name"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Heru Surya"
                className="w-full min-h-[56px] px-4 text-[18px] sm:text-[20px] font-bold text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-blue-950 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Input PIN */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="input-pin"
                className="text-[14px] font-bold uppercase tracking-wider text-slate-700"
              >
                PIN (6 Digit)
              </label>
              <input
                id="input-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full min-h-[56px] px-4 text-center tracking-widest text-[22px] sm:text-[24px] font-black text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-blue-950 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Tombol Masuk */}
            <div className="pt-2">
              <TombolBesar
                type="submit"
                variant="utama"
                memuat={memuat}
                teksMemuat="Memeriksa..."
              >
                Masuk
              </TombolBesar>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[13px] text-slate-400">
        Jimpitan RT 23 RW 6 · Kelurahan Munggut
      </footer>
    </div>
  );
}
