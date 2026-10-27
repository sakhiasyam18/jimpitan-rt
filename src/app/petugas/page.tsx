'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { VSaldoWarga } from '@/types';
import { daftarRumah } from '@/actions/setoran';
import { formatTanggal } from '@/lib/format';
import FilterBlok from '@/components/FilterBlok';
import BarisRumah from '@/components/BarisRumah';
import LayarTerimaSetoran from '@/components/LayarTerimaSetoran';
import KotakBerhasil from '@/components/KotakBerhasil';
import KotakGalat from '@/components/KotakGalat';

export default function DaftarRumahPage() {
  const [daftar, setDaftar] = useState<VSaldoWarga[]>([]);
  const [blokDipilih, setBlokDipilih] = useState<string>('Semua');
  const [cariTeks, setCariTeks] = useState<string>('');
  const [memuat, setMemuat] = useState<boolean>(true);
  const [galat, setGalat] = useState<string | null>(null);

  const [rumahAktif, setRumahAktif] = useState<VSaldoWarga | null>(null);
  const [lembarTerbuka, setLembarTerbuka] = useState<boolean>(false);
  const [pesanTersimpan, setPesanTersimpan] = useState<string | null>(null);

  // Ambil daftar rumah dari view v_saldo_warga
  async function muatData(blok: string = blokDipilih) {
    setMemuat(true);
    setGalat(null);

    const filterBlokParam =
      blok === 'Semua' ? undefined : (blok as 'C0' | 'C1' | 'C2');

    const hasil = await daftarRumah(filterBlokParam);

    setMemuat(false);

    if (hasil.ok) {
      setDaftar(hasil.data);
    } else {
      setGalat(hasil.error.pesan);
    }
  }

  useEffect(() => {
    muatData(blokDipilih);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blokDipilih]);

  // Filter pencarian nama/nomor di sisi client (tanpa memanggil server)
  const daftarTersaring = useMemo(() => {
    const q = cariTeks.trim().toLowerCase();
    if (!q) return daftar;
    return daftar.filter((r) => {
      const namaCocok = r.nama && r.nama.toLowerCase().includes(q);
      const noCocok = r.no_rumah && r.no_rumah.toLowerCase().includes(q);
      const labelCocok = r.label && r.label.toLowerCase().includes(q);
      return namaCocok || noCocok || labelCocok;
    });
  }, [daftar, cariTeks]);

  // Hitung jumlah rumah dengan saldo >= 0
  const jumlahSudah = useMemo(() => {
    return daftar.filter((r) => r.saldo >= 0).length;
  }, [daftar]);

  const tanggalSabtu = daftar.length > 0 && daftar[0].sabtu_terbaru
    ? formatTanggal(daftar[0].sabtu_terbaru, 'hari')
    : 'Sabtu Ini';

  function handleKetukRumah(r: VSaldoWarga) {
    setRumahAktif(r);
    setLembarTerbuka(true);
  }

  function handleBerhasilSimpan(rumahBaru: VSaldoWarga) {
    // Perbarui baris di dalam daftar secara instan tanpa memuat ulang (posisi gulir tidak melompat)
    setDaftar((prev) =>
      prev.map((r) => (r.warga_id === rumahBaru.warga_id ? rumahBaru : r))
    );

    // Tampilkan notifikasi "Tersimpan" selama 2 detik
    setPesanTersimpan('Tersimpan');
    setTimeout(() => {
      setPesanTersimpan(null);
    }, 2000);
  }

  return (
    <div className="flex flex-col">
      {/* Notifikasi Tersimpan 2 Detik */}
      {pesanTersimpan && (
        <div className="fixed top-20 left-4 right-4 z-50 max-w-[440px] mx-auto">
          <KotakBerhasil pesan={pesanTersimpan} />
        </div>
      )}

      {/* Kepala Daftar */}
      <section className="bg-white p-4 border-b border-slate-200 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[18px] sm:text-[20px] font-black text-slate-900">
            {tanggalSabtu}
          </span>
          <span className="text-[15px] sm:text-[16px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
            {jumlahSudah} / {daftar.length} sudah
          </span>
        </div>

        {/* Filter Blok */}
        <FilterBlok
          blokTerpilih={blokDipilih}
          onPilihBlok={(b) => setBlokDipilih(b)}
          disabled={memuat}
        />

        {/* Kotak Cari Nama */}
        <div>
          <label htmlFor="cari-rumah" className="sr-only">
            Cari rumah atau nama
          </label>
          <input
            id="cari-rumah"
            type="text"
            value={cariTeks}
            onChange={(e) => setCariTeks(e.target.value)}
            placeholder="Cari nomor atau nama warga..."
            className="w-full min-h-[50px] px-4 text-[16px] sm:text-[18px] font-semibold bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-blue-950 focus:bg-white focus:outline-none"
          />
        </div>
      </section>

      {/* Konten Utama Daftar Rumah */}
      <main className="p-4 flex flex-col gap-2.5">
        {memuat ? (
          <div className="p-12 text-center text-slate-600 font-bold text-[20px]">
            Memuat...
          </div>
        ) : galat ? (
          <KotakGalat pesan={galat} onCobaLagi={() => muatData(blokDipilih)} />
        ) : daftarTersaring.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-semibold text-[17px] bg-white rounded-2xl border border-slate-200">
            {cariTeks ? 'Tidak ada rumah yang cocok.' : 'Belum ada data rumah.'}
          </div>
        ) : (
          daftarTersaring.map((r) => (
            <BarisRumah
              key={r.warga_id}
              rumah={r}
              onClick={handleKetukRumah}
            />
          ))
        )}
      </main>

      {/* Lembar Terima Setoran Penuh Layar */}
      <LayarTerimaSetoran
        rumah={rumahAktif}
        terbuka={lembarTerbuka}
        onTutup={() => setLembarTerbuka(false)}
        onBerhasilSimpan={handleBerhasilSimpan}
      />
    </div>
  );
}
