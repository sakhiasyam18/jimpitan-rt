'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { namaToInternalEmail } from '@/lib/saldo';

export default function LoginPage() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedNama = nama.trim();
    const cleanPin = pin.trim();

    if (!trimmedNama) {
      setErrorMsg('Mohon masukkan nama petugas');
      return;
    }

    if (cleanPin.length < 6) {
      setErrorMsg('PIN minimal harus 6 angka');
      return;
    }

    setLoading(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Jika Supabase belum dikonfigurasi (.env masih kosong), berikan mode simulasi ramah dev
      if (!supabaseUrl || !supabaseKey) {
        // Simpan sesi simulasi sederhana di cookie / localStorage
        document.cookie = `simulated_petugas=${encodeURIComponent(trimmedNama)}; path=/; max-age=86400`;
        router.push('/petugas');
        return;
      }

      const supabase = createClient();
      const email = namaToInternalEmail(trimmedNama);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: cleanPin,
      });

      if (error) {
        console.error('Login error:', error);
        setErrorMsg('Nama atau PIN tidak sesuai. Mohon periksa kembali.');
        setLoading(false);
        return;
      }

      if (data.user) {
        router.push('/petugas');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto w-full border-x border-slate-200">
      {/* Tombol Kembali */}
      <div className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs transition"
        >
          ← Kembali ke Beranda
        </Link>
      </div>

      {/* Konten Form Login */}
      <main className="p-5 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md flex flex-col gap-5">
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-3">
              🔐
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Masuk Petugas
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Khusus petugas jimpitan RT 23
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-start gap-2.5">
              <span className="text-base shrink-0">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Input Nama Petugas */}
            <div>
              <label
                htmlFor="nama"
                className="block text-sm font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Nama Petugas
              </label>
              <input
                id="nama"
                type="text"
                autoComplete="name"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Heru Surya"
                className="w-full h-14 px-4 text-lg font-semibold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-600 focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Input PIN 6 Digit */}
            <div>
              <label
                htmlFor="pin"
                className="block text-sm font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                PIN (6 Angka)
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full h-14 px-4 text-center tracking-widest text-2xl font-extrabold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-600 focus:bg-white focus:outline-none transition"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Gunakan 6 digit PIN yang sudah didaftarkan
              </p>
            </div>

            {/* Tombol Masuk Besar */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-15 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-lg rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Memeriksa...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Perlu bantuan akun? Hubungi pengurus RT
        </p>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-400">
        Jimpitan RT 23 RW 06 · Kelurahan Munggut
      </footer>
    </div>
  );
}
