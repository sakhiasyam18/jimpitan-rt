'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { AkunPetugasRow, JadwalRow } from '@/types';
import {
  lihatJadwal,
  aturJadwal,
  isiJadwalOtomatis,
  daftarPetugasAktif,
} from '@/actions/jadwal';
import { formatTanggal } from '@/lib/format';
import { getSabtuTerkait } from '@/lib/saldo';
import TombolBesar from '@/components/TombolBesar';
import KotakBerhasil from '@/components/KotakBerhasil';
import KotakGalat from '@/components/KotakGalat';

interface BarisSabtu {
  tanggal: string;
  petugas_1: string | null;
  petugas_2: string | null;
  catatan?: string | null;
  memuatSimpan?: boolean;
  galatBaris?: string | null;
  suksesBaris?: boolean;
}

export default function JadwalPage() {
  const [daftarSabtu, setDaftarSabtu] = useState<BarisSabtu[]>([]);
  const [petugasList, setPetugasList] = useState<AkunPetugasRow[]>([]);
  const [currentWargaId, setCurrentWargaId] = useState<string | null>(null);
  const [memuatHalaman, setMemuatHalaman] = useState<boolean>(true);
  const [galatHalaman, setGalatHalaman] = useState<string | null>(null);
  const [pesanGlobal, setPesanGlobal] = useState<string | null>(null);
  const [memuatOtomatis, setMemuatOtomatis] = useState<boolean>(false);

  // Ambil daftar 8 Sabtu ke depan
  function hitung8Sabtu(): string[] {
    const sabtuIni = getSabtuTerkait();
    const [y, m, d] = sabtuIni.split('-').map(Number);
    const startDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    const list: string[] = [];
    for (let i = 0; i < 8; i++) {
      const cur = new Date(startDate);
      cur.setUTCDate(cur.getUTCDate() + i * 7);
      list.push(cur.toISOString().split('T')[0]);
    }
    return list;
  }

  async function muatData() {
    setMemuatHalaman(true);
    setGalatHalaman(null);

    try {
      // 1. Ambil info user yang sedang login untuk tanda (Anda)
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: akunSaya } = await supabase
          .from('akun_petugas')
          .select('warga_id')
          .eq('user_id', user.id)
          .single();
        if (akunSaya?.warga_id) {
          setCurrentWargaId(akunSaya.warga_id);
        }
      }

      // 2. Ambil daftar petugas aktif
      const hasilPetugas = await daftarPetugasAktif();
      if (!hasilPetugas.ok) {
        setGalatHalaman(hasilPetugas.error.pesan);
        setMemuatHalaman(false);
        return;
      }
      setPetugasList(hasilPetugas.data);

      // 3. Ambil jadwal 8 Sabtu
      const delapanSabtu = hitung8Sabtu();
      const tglAwal = delapanSabtu[0];
      const tglAkhir = delapanSabtu[delapanSabtu.length - 1];

      const hasilJadwal = await lihatJadwal(tglAwal, tglAkhir);
      if (!hasilJadwal.ok) {
        setGalatHalaman(hasilJadwal.error.pesan);
        setMemuatHalaman(false);
        return;
      }

      const jadwalMap = new Map<string, JadwalRow>();
      hasilJadwal.data.forEach((j) => {
        jadwalMap.set(j.tanggal, j);
      });

      // Susun 8 baris (Sabtu tanpa isi tetap ditampilkan sebagai baris kosong)
      const barisGabungan: BarisSabtu[] = delapanSabtu.map((tgl) => {
        const ada = jadwalMap.get(tgl);
        return {
          tanggal: tgl,
          petugas_1: ada?.petugas_1 || null,
          petugas_2: ada?.petugas_2 || null,
          catatan: ada?.catatan || null,
        };
      });

      setDaftarSabtu(barisGabungan);
    } catch (err) {
      console.error(err);
      setGalatHalaman('Gagal memuat jadwal.');
    } finally {
      setMemuatHalaman(false);
    }
  }

  useEffect(() => {
    muatData();
  }, []);

  function handleUbahPetugas(
    tanggal: string,
    kolom: 'petugas_1' | 'petugas_2',
    val: string | null
  ) {
    setDaftarSabtu((prev) =>
      prev.map((b) => {
        if (b.tanggal !== tanggal) return b;
        const updated = { ...b, [kolom]: val || null, galatBaris: null };
        // Validasi instan petugas sama
        if (updated.petugas_1 && updated.petugas_2 && updated.petugas_1 === updated.petugas_2) {
          updated.galatBaris = 'Dua petugas harus orang berbeda.';
        }
        return updated;
      })
    );
  }

  async function handleSimpanBaris(baris: BarisSabtu) {
    if (baris.petugas_1 && baris.petugas_2 && baris.petugas_1 === baris.petugas_2) {
      setDaftarSabtu((prev) =>
        prev.map((b) =>
          b.tanggal === baris.tanggal
            ? { ...b, galatBaris: 'Dua petugas harus orang berbeda.' }
            : b
        )
      );
      return;
    }

    setDaftarSabtu((prev) =>
      prev.map((b) => (b.tanggal === baris.tanggal ? { ...b, memuatSimpan: true, galatBaris: null } : b))
    );

    const hasil = await aturJadwal({
      tanggal: baris.tanggal,
      petugas_1: baris.petugas_1,
      petugas_2: baris.petugas_2,
      catatan: baris.catatan,
    });

    if (hasil.ok) {
      setDaftarSabtu((prev) =>
        prev.map((b) =>
          b.tanggal === baris.tanggal
            ? { ...b, memuatSimpan: false, suksesBaris: true, galatBaris: null }
            : b
        )
      );
      setTimeout(() => {
        setDaftarSabtu((prev) =>
          prev.map((b) => (b.tanggal === baris.tanggal ? { ...b, suksesBaris: false } : b))
        );
      }, 2000);
    } else {
      setDaftarSabtu((prev) =>
        prev.map((b) =>
          b.tanggal === baris.tanggal
            ? { ...b, memuatSimpan: false, galatBaris: hasil.error.pesan }
            : b
        )
      );
    }
  }

  async function handleIsiOtomatis() {
    const yakin = window.confirm(
      'Mengisi Sabtu yang masih kosong. Yang sudah terisi tidak diubah.'
    );
    if (!yakin) return;

    const delapan = hitung8Sabtu();
    const sabtuAwal = delapan[0];

    setMemuatOtomatis(true);
    const hasil = await isiJadwalOtomatis({
      tanggal_mulai: sabtuAwal,
      jumlah_minggu: 4,
    });
    setMemuatOtomatis(false);

    if (hasil.ok) {
      setPesanGlobal(`Berhasil mengisi ${hasil.data.jumlah_diisi} Sabtu otomatis.`);
      setTimeout(() => setPesanGlobal(null), 3000);
      muatData();
    } else {
      alert(hasil.error.pesan);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Judul & Tombol Isi Otomatis */}
      <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
        <h1 className="text-[24px] sm:text-[26px] font-black text-slate-950 tracking-tight">
          Jadwal Jaga
        </h1>
        <p className="text-[15px] font-medium text-slate-500">
          Atur 2 orang petugas jaga per Sabtu
        </p>

        <TombolBesar
          variant="sekunder"
          memuat={memuatOtomatis}
          onClick={handleIsiOtomatis}
        >
          Isi 4 minggu otomatis
        </TombolBesar>
      </section>

      {pesanGlobal && <KotakBerhasil pesan={pesanGlobal} />}
      {galatHalaman && <KotakGalat pesan={galatHalaman} onCobaLagi={muatData} />}

      {/* Daftar Kartu Sabtu */}
      <main className="flex flex-col gap-3.5">
        {memuatHalaman ? (
          <div className="p-12 text-center text-slate-600 font-bold text-[20px]">
            Memuat...
          </div>
        ) : daftarSabtu.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-semibold text-[17px] bg-white rounded-2xl border border-slate-200">
            Belum ada jadwal.
          </div>
        ) : (
          daftarSabtu.map((baris, idx) => {
            const tglFormatted = formatTanggal(baris.tanggal, 'hari');

            return (
              <div
                key={baris.tanggal}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3.5"
              >
                {/* Tanggal Besar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h2 className="text-[20px] sm:text-[22px] font-black text-slate-900">
                    {tglFormatted}
                  </h2>
                  {idx === 0 && (
                    <span className="text-[13px] font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      Terdekat
                    </span>
                  )}
                </div>

                {baris.galatBaris && <KotakGalat pesan={baris.galatBaris} />}
                {baris.suksesBaris && <KotakBerhasil pesan="Jadwal Tersimpan" />}

                {/* Petugas 1 */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`p1-${baris.tanggal}`}
                    className="text-[14px] font-bold uppercase tracking-wider text-slate-700"
                  >
                    Petugas 1:
                  </label>
                  <select
                    id={`p1-${baris.tanggal}`}
                    value={baris.petugas_1 || ''}
                    onChange={(e) =>
                      handleUbahPetugas(baris.tanggal, 'petugas_1', e.target.value || null)
                    }
                    className="w-full min-h-[56px] px-3.5 text-[18px] font-bold text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-blue-950 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Pilih Petugas 1 --</option>
                    {petugasList.map((p) => {
                      const isSaya = p.warga_id === currentWargaId;
                      return (
                        <option key={p.user_id} value={p.warga_id || ''}>
                          {p.nama} {isSaya ? '(Anda)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Petugas 2 */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`p2-${baris.tanggal}`}
                    className="text-[14px] font-bold uppercase tracking-wider text-slate-700"
                  >
                    Petugas 2:
                  </label>
                  <select
                    id={`p2-${baris.tanggal}`}
                    value={baris.petugas_2 || ''}
                    onChange={(e) =>
                      handleUbahPetugas(baris.tanggal, 'petugas_2', e.target.value || null)
                    }
                    className="w-full min-h-[56px] px-3.5 text-[18px] font-bold text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-blue-950 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Pilih Petugas 2 --</option>
                    {petugasList.map((p) => {
                      const isSaya = p.warga_id === currentWargaId;
                      return (
                        <option key={p.user_id} value={p.warga_id || ''}>
                          {p.nama} {isSaya ? '(Anda)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Tombol Simpan Per Kartu */}
                <div className="pt-1">
                  <TombolBesar
                    variant="utama"
                    memuat={baris.memuatSimpan}
                    onClick={() => handleSimpanBaris(baris)}
                  >
                    Simpan
                  </TombolBesar>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
