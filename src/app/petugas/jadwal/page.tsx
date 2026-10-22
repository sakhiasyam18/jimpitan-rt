'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { INITIAL_WARGA } from '@/lib/mock-data';
import { Warga, Jadwal } from '@/types/database';
import {
  formatTanggalIndonesia,
  getSabtuTerkait,
  toDateString,
} from '@/lib/saldo';

export default function JadwalJagaPage() {
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>(INITIAL_WARGA);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Load daftar jadwal & warga
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Inisialisasi daftar 4 Sabtu ke depan
      const sabtuIni = getSabtuTerkait();
      const defaultJadwals: Jadwal[] = [];
      const cur = new Date(sabtuIni);

      for (let i = 0; i < 5; i++) {
        const d = new Date(cur);
        d.setDate(d.getDate() + i * 7);
        const tglStr = toDateString(d);
        defaultJadwals.push({
          id: `local-jadwal-${i}`,
          tanggal: tglStr,
          petugas_1: i === 0 ? 'c2-07' : null,
          petugas_2: i === 0 ? 'c2-02' : null,
          catatan: i === 0 ? 'Jaga mulai 19.30' : null,
        });
      }

      if (!supabaseUrl || !supabaseKey) {
        setJadwalList(defaultJadwals);
        setWargaList(INITIAL_WARGA);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: dbWarga } = await supabase
          .from('warga')
          .select('*')
          .eq('aktif', true)
          .order('nama');

        if (dbWarga && dbWarga.length > 0) {
          setWargaList(dbWarga);
        }

        const { data: dbJadwal } = await supabase
          .from('jadwal')
          .select('*')
          .gte('tanggal', sabtuIni)
          .order('tanggal', { ascending: true })
          .limit(10);

        if (dbJadwal && dbJadwal.length > 0) {
          // Gabungkan jadwal yang ada dengan minggu berikutnya jika masih kosong
          const combined = [...dbJadwal];
          defaultJadwals.forEach((dj) => {
            if (!combined.some((j) => j.tanggal === dj.tanggal)) {
              combined.push(dj);
            }
          });
          combined.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
          setJadwalList(combined);
        } else {
          setJadwalList(defaultJadwals);
        }
      } catch (err) {
        console.error('Error memuat jadwal:', err);
        setJadwalList(defaultJadwals);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSimpanBaris(j: Jadwal) {
    setSavingId(j.tanggal);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient();
        const payload = {
          tanggal: j.tanggal,
          petugas_1: j.petugas_1,
          petugas_2: j.petugas_2,
          catatan: j.catatan,
        };

        const { error } = await supabase
          .from('jadwal')
          .upsert(payload, { onConflict: 'tanggal' });

        if (error) {
          alert('Gagal menyimpan jadwal: ' + error.message);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    setNotification(`Jadwal tanggal ${formatTanggalIndonesia(j.tanggal, false)} tersimpan!`);
    setTimeout(() => setNotification(null), 3000);
    setSavingId(null);
  }

  function updateJadwalItem(tanggal: string, field: keyof Jadwal, value: string | null) {
    setJadwalList((prev) =>
      prev.map((item) => {
        if (item.tanggal === tanggal) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-md mx-auto w-full border-x border-slate-300 pb-16 shadow-xl">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 sm:p-5 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
              Pengaturan RT 23
            </span>
            <h1 className="text-xl font-black truncate mt-0.5">
              📅 Jadwal Jaga Sabtu
            </h1>
          </div>
          <Link
            href="/petugas"
            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition"
          >
            ← Kembali
          </Link>
        </div>

        {/* Menu Navigasi Petugas */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-2 border-t border-slate-800 text-center text-xs font-bold">
          <Link
            href="/petugas"
            className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            📋 Setoran
          </Link>
          <Link
            href="/petugas/jadwal"
            className="py-2 rounded-xl bg-emerald-600 text-white shadow-xs"
          >
            📅 Jadwal Jaga
          </Link>
          <Link
            href="/petugas/warga"
            className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            🏠 Data Warga
          </Link>
        </div>
      </header>

      {/* Notifikasi */}
      {notification && (
        <div className="m-4 p-3 bg-emerald-600 text-white rounded-xl font-bold text-sm text-center shadow-md animate-in fade-in">
          ✓ {notification}
        </div>
      )}

      {/* Konten Jadwal */}
      <main className="p-4 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium">
          💡 Setiap hari Sabtu dijadwalkan <span className="font-bold text-slate-800">2 orang petugas jaga</span> untuk mengambil dan mencatat jimpitan keliling.
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 font-bold">
            <span className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></span>
            <p>Memuat jadwal...</p>
          </div>
        ) : (
          jadwalList.map((j, idx) => {
            const isSaving = savingId === j.tanggal;
            const isSabtuPertama = idx === 0;

            return (
              <div
                key={j.tanggal}
                className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs flex flex-col gap-3 ${
                  isSabtuPertama
                    ? 'border-emerald-300 ring-2 ring-emerald-100'
                    : 'border-slate-200'
                }`}
              >
                {/* Tanggal Sabtu */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900">
                      {formatTanggalIndonesia(j.tanggal)}
                    </span>
                    {isSabtuPertama && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                        Sabtu Terdekat
                      </span>
                    )}
                  </div>
                </div>

                {/* Petugas 1 */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Petugas 1:
                  </label>
                  <select
                    value={j.petugas_1 || ''}
                    onChange={(e) =>
                      updateJadwalItem(j.tanggal, 'petugas_1', e.target.value || null)
                    }
                    className="w-full h-12 px-3 text-base font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Pilih Petugas 1 --</option>
                    {wargaList.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nama} ({w.blok}/{w.no_rumah})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Petugas 2 */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Petugas 2:
                  </label>
                  <select
                    value={j.petugas_2 || ''}
                    onChange={(e) =>
                      updateJadwalItem(j.tanggal, 'petugas_2', e.target.value || null)
                    }
                    className="w-full h-12 px-3 text-base font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Pilih Petugas 2 --</option>
                    {wargaList.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nama} ({w.blok}/{w.no_rumah})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Catatan Opsional */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Catatan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={j.catatan || ''}
                    onChange={(e) =>
                      updateJadwalItem(j.tanggal, 'catatan', e.target.value || null)
                    }
                    placeholder="Contoh: Mulai pukul 19.30 WIB"
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Tombol Simpan Baris */}
                <button
                  type="button"
                  onClick={() => handleSimpanBaris(j)}
                  disabled={isSaving}
                  className="mt-1 w-full h-12 bg-slate-900 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : '✓ Simpan Jadwal Ini'}
                </button>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
