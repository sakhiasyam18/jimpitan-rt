'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { INITIAL_WARGA, DEFAULT_PENGATURAN } from '@/lib/mock-data';
import {
  Warga,
  RumahWithStatus,
  Setoran,
  Pengaturan,
} from '@/types/database';
import {
  formatRupiah,
  formatTanggalIndonesia,
  getLabelRumah,
  getSabtuTerkait,
  hitungJumlahSabtu,
  hitungStatusRumah,
} from '@/lib/saldo';
import TerimaSetoranModal from '@/components/TerimaSetoranModal';

export default function PetugasDashboardPage() {
  const router = useRouter();

  const [currentTanggal, setCurrentTanggal] = useState<string>('2026-10-24');
  const [selectedBlok, setSelectedBlok] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRumah, setSelectedRumah] = useState<RumahWithStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [wargaList, setWargaList] = useState<Warga[]>(INITIAL_WARGA);
  const [setoranList, setSetoranList] = useState<Setoran[]>([]);
  const [pengaturan, setPengaturan] = useState<Pengaturan>(DEFAULT_PENGATURAN);
  const [petugasNama, setPetugasNama] = useState<string>('Petugas RT');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Inisialisasi data dari Supabase atau fallback local state
  useEffect(() => {
    setCurrentTanggal(getSabtuTerkait());

    async function loadData() {
      setLoading(true);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        // Mode demo / fallback
        // Cek cookie simulasi jika ada
        const cookies = document.cookie.split(';');
        const match = cookies.find((c) => c.trim().startsWith('simulated_petugas='));
        if (match) {
          setPetugasNama(decodeURIComponent(match.split('=')[1]));
        }
        setWargaList(INITIAL_WARGA);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // 1. Cek profil user login
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          const { data: profil } = await supabase
            .from('akun_petugas')
            .select('nama')
            .eq('user_id', user.id)
            .single();

          if (profil?.nama) {
            setPetugasNama(profil.nama);
          } else if (user.email) {
            setPetugasNama(user.email.split('@')[0]);
          }
        }

        // 2. Ambil data warga
        const { data: dataWarga } = await supabase
          .from('warga')
          .select('*')
          .eq('aktif', true)
          .order('blok')
          .order('no_rumah');

        if (dataWarga && dataWarga.length > 0) {
          setWargaList(dataWarga);
        }

        // 3. Ambil data setoran
        const { data: dataSetoran } = await supabase
          .from('setoran')
          .select('*');

        if (dataSetoran) {
          setSetoranList(dataSetoran);
        }

        // 4. Ambil pengaturan
        const { data: dataPengaturan } = await supabase
          .from('pengaturan')
          .select('*')
          .eq('id', 1)
          .single();

        if (dataPengaturan) {
          setPengaturan(dataPengaturan);
        }
      } catch (err) {
        console.error('Error memuat data petugas:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Hitung jumlah sabtu dari pengaturan.tanggal_mulai sampai currentTanggal
  const jumlahSabtu = useMemo(() => {
    return hitungJumlahSabtu(pengaturan.tanggal_mulai, currentTanggal);
  }, [pengaturan.tanggal_mulai, currentTanggal]);

  // Gabungkan warga dengan status saldo dan setoran hari ini
  const rumahWithStatusList = useMemo(() => {
    // Map total bayar per warga_id
    const totalBayarMap = new Map<string, number>();
    // Map setoran pada tanggal aktif per warga_id
    const setoranHariIniMap = new Map<string, number>();

    setoranList.forEach((s) => {
      totalBayarMap.set(s.warga_id, (totalBayarMap.get(s.warga_id) || 0) + s.jumlah);
      if (s.tanggal === currentTanggal) {
        setoranHariIniMap.set(s.warga_id, s.jumlah);
      }
    });

    return wargaList.map((w) => {
      const totalBayar = totalBayarMap.get(w.id) || 0;
      const setoranHariIni = setoranHariIniMap.has(w.id)
        ? (setoranHariIniMap.get(w.id) ?? 0)
        : null;

      return hitungStatusRumah(
        w,
        totalBayar,
        setoranHariIni,
        jumlahSabtu,
        pengaturan.iuran_per_minggu,
        pengaturan.batas_langganan_nunggak
      );
    });
  }, [wargaList, setoranList, currentTanggal, jumlahSabtu, pengaturan]);

  // Filter daftar rumah berdasarkan blok dan query pencarian
  const filteredRumahList = useMemo(() => {
    return rumahWithStatusList.filter((r) => {
      const matchBlok = selectedBlok === 'Semua' || r.blok === selectedBlok;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        r.nama.toLowerCase().includes(query) ||
        r.no_rumah.toLowerCase().includes(query) ||
        `${r.blok}/${r.no_rumah}`.toLowerCase().includes(query);

      return matchBlok && matchQuery;
    });
  }, [rumahWithStatusList, selectedBlok, searchQuery]);

  // Statistik ringkasan untuk header
  const stats = useMemo(() => {
    let terkumpul = 0;
    let sudahBayar = 0;
    const total = rumahWithStatusList.length;

    rumahWithStatusList.forEach((r) => {
      if (r.setoran_sabtu_ini && r.setoran_sabtu_ini > 0) {
        terkumpul += r.setoran_sabtu_ini;
        sudahBayar++;
      }
    });

    return {
      terkumpul,
      sudahBayar,
      total,
      persentase: total > 0 ? Math.round((sudahBayar / total) * 100) : 0,
    };
  }, [rumahWithStatusList]);

  // Simpan setoran ke database atau state lokal
  async function handleSaveSetoran(wargaId: string, nominal: number) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Perbarui state lokal secara instan (optimistic update)
    setSetoranList((prev) => {
      const existingIdx = prev.findIndex(
        (s) => s.tanggal === currentTanggal && s.warga_id === wargaId
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          jumlah: nominal,
          dicatat_pada: new Date().toISOString(),
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            tanggal: currentTanggal,
            warga_id: wargaId,
            jumlah: nominal,
            dicatat_oleh: userId,
            dicatat_pada: new Date().toISOString(),
          },
        ];
      }
    });

    // Jika Supabase terhubung, simpan ke Postgres
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient();
        const { error } = await supabase.from('setoran').upsert(
          {
            tanggal: currentTanggal,
            warga_id: wargaId,
            jumlah: nominal,
            dicatat_oleh: userId,
            dicatat_pada: new Date().toISOString(),
          },
          {
            onConflict: 'tanggal, warga_id',
          }
        );

        if (error) {
          console.error('Gagal menyimpan setoran ke Supabase:', error);
          alert('Gagal menyimpan ke server: ' + error.message);
        }
      } catch (err) {
        console.error('Error saat menyimpan setoran:', err);
      }
    }

    // Tampilkan notifikasi kecil
    const targetWarga = wargaList.find((w) => w.id === wargaId);
    if (targetWarga) {
      setSaveSuccessMsg(`Setoran ${getLabelRumah(targetWarga)} sebesar ${formatRupiah(nominal)} tersimpan!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  }

  // Logout handler
  async function handleLogout() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    document.cookie = 'simulated_petugas=; path=/; max-age=0';
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-md mx-auto w-full border-x border-slate-300 pb-20 shadow-xl">
      {/* Header Petugas */}
      <header className="bg-slate-900 text-white p-4 sm:p-5 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
              Panel Petugas Jimpitan RT 23
            </span>
            <h1 className="text-xl font-black truncate mt-0.5">
              👤 {petugasNama}
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition cursor-pointer shrink-0 border border-slate-700"
          >
            Keluar 🚪
          </button>
        </div>

        {/* Tanggal Sabtu Aktif */}
        <div className="mt-3 flex items-center justify-between bg-slate-800/80 px-3.5 py-2.5 rounded-xl border border-slate-700/80">
          <div className="text-xs">
            <span className="text-slate-400 block">Jadwal Setoran:</span>
            <span className="font-extrabold text-white text-sm">
              {formatTanggalIndonesia(currentTanggal)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const d = new Date(currentTanggal);
                d.setDate(d.getDate() - 7);
                setCurrentTanggal(d.toISOString().split('T')[0]);
              }}
              title="Sabtu Sebelumnya"
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ◀
            </button>
            <button
              onClick={() => setCurrentTanggal(getSabtuTerkait())}
              title="Kembali ke Sabtu Ini"
              className="text-[11px] font-bold px-2 py-1.5 rounded-lg bg-emerald-600 text-white cursor-pointer"
            >
              Sabtu Ini
            </button>
            <button
              onClick={() => {
                const d = new Date(currentTanggal);
                d.setDate(d.getDate() + 7);
                setCurrentTanggal(d.toISOString().split('T')[0]);
              }}
              title="Sabtu Berikutnya"
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Menu Navigasi Petugas */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800 text-center text-xs font-bold">
          <Link
            href="/petugas"
            className="py-2 rounded-xl bg-emerald-600 text-white shadow-xs"
          >
            📋 Setoran
          </Link>
          <Link
            href="/petugas/jadwal"
            className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
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

      {/* Notifikasi Sukses Simpan */}
      {saveSuccessMsg && (
        <div className="sticky top-40 z-20 mx-4 mt-3 p-3 bg-emerald-600 text-white rounded-xl font-bold text-sm text-center shadow-lg animate-in fade-in duration-200">
          ✓ {saveSuccessMsg}
        </div>
      )}

      {/* Ringkasan Angka Progres Hari Ini */}
      <div className="p-4 bg-white border-b border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 block">
              Terkumpul Hari Ini
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
              {formatRupiah(stats.terkumpul)}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
              Rumah Bayar
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {stats.sudahBayar} <span className="text-sm font-semibold text-slate-500">/ {stats.total}</span>
            </p>
          </div>
        </div>

        {/* Progres Bar */}
        <div className="mt-3">
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${stats.persentase}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 mt-1">
            <span>Progres Sabtu Ini</span>
            <span>{stats.persentase}%</span>
          </div>
        </div>
      </div>

      {/* Filter Blok (Tombol Besar Ramah Sentuhan) */}
      <div className="p-4 bg-white/70 backdrop-blur-xs sticky top-[160px] z-10 border-b border-slate-200">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
          Pilih Blok:
        </span>
        <div className="grid grid-cols-4 gap-2">
          {['Semua', 'C0', 'C1', 'C2'].map((blok) => {
            const isSelected = selectedBlok === blok;
            return (
              <button
                key={blok}
                type="button"
                onClick={() => setSelectedBlok(blok)}
                className={`h-14 rounded-2xl font-extrabold text-base transition flex items-center justify-center cursor-pointer border-2 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95'
                }`}
              >
                {blok}
              </button>
            );
          })}
        </div>

        {/* Pencarian Cepat Nama / Nomor */}
        <div className="mt-3 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor rumah atau nama..."
            className="w-full h-12 pl-10 pr-4 text-sm font-semibold bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Daftar Rumah */}
      <main className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>Daftar {filteredRumahList.length} Rumah:</span>
          <span>Tap rumah untuk catat</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 font-bold">
            <span className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></span>
            <p>Memuat daftar rumah...</p>
          </div>
        ) : filteredRumahList.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-medium">
            Tidak ada rumah yang cocok dengan pencarian
          </div>
        ) : (
          filteredRumahList.map((rumah) => {
            const hasPaidThisSaturday =
              rumah.setoran_sabtu_ini !== null && rumah.setoran_sabtu_ini > 0;
            const isZeroThisSaturday = rumah.setoran_sabtu_ini === 0;
            const isNunggak = rumah.saldo < 0;

            return (
              <div
                key={rumah.id}
                onClick={() => {
                  setSelectedRumah(rumah);
                  setIsModalOpen(true);
                }}
                className={`p-4 rounded-2xl border transition shadow-xs flex items-center justify-between gap-3 cursor-pointer active:scale-[0.98] ${
                  isNunggak
                    ? 'bg-rose-50/70 border-rose-300 hover:bg-rose-100/70'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                {/* Info Rumah */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      {getLabelRumah(rumah)}
                    </h3>
                    {rumah.is_langganan_nunggak && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-md animate-pulse">
                        Langganan Nunggak
                      </span>
                    )}
                  </div>

                  {/* Keterangan Saldo */}
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    {isNunggak ? (
                      <span className="font-extrabold text-rose-700">
                        ⚠️ Nunggak {rumah.minggu_nunggak} minggu ({formatRupiah(rumah.saldo)})
                      </span>
                    ) : rumah.saldo > 0 ? (
                      <span className="font-bold text-emerald-700">
                        ✓ Lebih {formatRupiah(rumah.saldo)}
                      </span>
                    ) : (
                      <span className="font-medium text-slate-500">
                        ✓ Lunas
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge Status Sabtu Ini */}
                <div className="shrink-0 text-right">
                  {hasPaidThisSaturday ? (
                    <div className="inline-flex flex-col items-end">
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-sm shadow-xs">
                        + {formatRupiah(rumah.setoran_sabtu_ini!)}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold mt-0.5">
                        Sudah Catat
                      </span>
                    </div>
                  ) : isZeroThisSaturday ? (
                    <div className="inline-flex flex-col items-end">
                      <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200">
                        Rp0 (Belum)
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition">
                      <span>+ Catat</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Modal / Dialog Terima Setoran */}
      <TerimaSetoranModal
        rumah={selectedRumah}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRumah(null);
        }}
        onSave={handleSaveSetoran}
      />
    </div>
  );
}
