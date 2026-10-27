'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { WargaRow } from '@/types';
import { daftarWarga, simpanWarga, ubahStatusWarga } from '@/actions/warga';
import TombolBesar from '@/components/TombolBesar';
import LembarPenuh from '@/components/LembarPenuh';
import KotakGalat from '@/components/KotakGalat';
import KotakBerhasil from '@/components/KotakBerhasil';
import Lencana from '@/components/Lencana';

export default function WargaPage() {
  const [semuaWarga, setSemuaWarga] = useState<WargaRow[]>([]);
  const [tampilkanNonaktif, setTampilkanNonaktif] = useState<boolean>(false);
  const [memuat, setMemuat] = useState<boolean>(true);
  const [galatHalaman, setGalatHalaman] = useState<string | null>(null);
  const [pesanBerhasil, setPesanBerhasil] = useState<string | null>(null);

  // State lembar tambah / ubah
  const [lembarTerbuka, setLembarTerbuka] = useState<boolean>(false);
  const [wargaDiedit, setWargaDiedit] = useState<WargaRow | null>(null);
  const [formNama, setFormNama] = useState<string>('');
  const [formBlok, setFormBlok] = useState<'C0' | 'C1' | 'C2'>('C0');
  const [formNoRumah, setFormNoRumah] = useState<string>('');
  const [memuatSimpan, setMemuatSimpan] = useState<boolean>(false);
  const [galatForm, setGalatForm] = useState<string | null>(null);

  async function muatData() {
    setMemuat(true);
    setGalatHalaman(null);

    const hasil = await daftarWarga({ termasukNonaktif: true });
    setMemuat(false);

    if (hasil.ok) {
      setSemuaWarga(hasil.data);
    } else {
      setGalatHalaman(hasil.error.pesan);
    }
  }

  useEffect(() => {
    muatData();
  }, []);

  const totalAktif = useMemo(() => {
    return semuaWarga.filter((w) => w.aktif).length;
  }, [semuaWarga]);

  // Kelompokkan per blok
  const wargaPerBlok = useMemo(() => {
    const list = tampilkanNonaktif ? semuaWarga : semuaWarga.filter((w) => w.aktif);
    const groups: { [key: string]: WargaRow[] } = { C0: [], C1: [], C2: [] };

    list.forEach((w) => {
      const b = w.blok || 'C0';
      if (!groups[b]) groups[b] = [];
      groups[b].push(w);
    });

    return groups;
  }, [semuaWarga, tampilkanNonaktif]);

  function handleBukaTambah() {
    setWargaDiedit(null);
    setFormNama('');
    setFormBlok('C0');
    setFormNoRumah('');
    setGalatForm(null);
    setLembarTerbuka(true);
  }

  function handleBukaUbah(w: WargaRow) {
    setWargaDiedit(w);
    setFormNama(w.nama);
    setFormBlok((w.blok as 'C0' | 'C1' | 'C2') || 'C0');
    setFormNoRumah(w.no_rumah);
    setGalatForm(null);
    setLembarTerbuka(true);
  }

  async function handleSimpan(e: React.FormEvent) {
    e.preventDefault();
    setGalatForm(null);
    setMemuatSimpan(true);

    const hasil = await simpanWarga({
      id: wargaDiedit?.id,
      blok: formBlok,
      no_rumah: formNoRumah,
      nama: formNama,
    });

    setMemuatSimpan(false);

    if (hasil.ok) {
      setLembarTerbuka(false);
      setPesanBerhasil(wargaDiedit ? 'Data warga berhasil diubah' : 'Rumah baru berhasil ditambah');
      setTimeout(() => setPesanBerhasil(null), 2500);
      muatData();
    } else {
      setGalatForm(hasil.error.pesan);
    }
  }

  async function handleUbahStatus() {
    if (!wargaDiedit) return;
    const targetStatus = !wargaDiedit.aktif;
    setMemuatSimpan(true);

    const hasil = await ubahStatusWarga(wargaDiedit.id, targetStatus);
    setMemuatSimpan(false);

    if (hasil.ok) {
      setLembarTerbuka(false);
      setPesanBerhasil(targetStatus ? 'Rumah diaktifkan kembali' : 'Rumah dinonaktifkan');
      setTimeout(() => setPesanBerhasil(null), 2500);
      muatData();
    } else {
      setGalatForm(hasil.error.pesan);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Kepala Data Warga */}
      <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] sm:text-[26px] font-black text-slate-950 tracking-tight">
            Data Warga
          </h1>
          <span className="text-[14px] sm:text-[15px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
            {totalAktif} rumah aktif
          </span>
        </div>

        {/* Tombol Tambah Rumah */}
        <TombolBesar variant="utama" onClick={handleBukaTambah}>
          + Tambah rumah
        </TombolBesar>

        {/* Saklar Tampilkan Nonaktif */}
        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={tampilkanNonaktif}
              onChange={(e) => setTampilkanNonaktif(e.target.checked)}
              className="w-5 h-5 rounded-md accent-blue-950 cursor-pointer"
            />
            <span className="text-[15px] sm:text-[16px] font-bold text-slate-700">
              Tampilkan yang nonaktif
            </span>
          </label>
        </div>
      </section>

      {pesanBerhasil && <KotakBerhasil pesan={pesanBerhasil} />}
      {galatHalaman && <KotakGalat pesan={galatHalaman} onCobaLagi={muatData} />}

      {/* Daftar Dikelompokkan Per Blok */}
      <main className="flex flex-col gap-4">
        {memuat ? (
          <div className="p-12 text-center text-slate-600 font-bold text-[20px]">
            Memuat...
          </div>
        ) : (
          ['C0', 'C1', 'C2'].map((blokKey) => {
            const barisList = wargaPerBlok[blokKey] || [];
            if (barisList.length === 0) return null;

            return (
              <div key={blokKey} className="flex flex-col gap-2">
                {/* Judul Pemisah Blok */}
                <div className="px-1 pt-2 flex items-center justify-between">
                  <h2 className="text-[18px] sm:text-[20px] font-black text-slate-800">
                    Blok {blokKey}
                  </h2>
                  <span className="text-[14px] font-bold text-slate-500">
                    {barisList.length} rumah
                  </span>
                </div>

                {barisList.map((w) => {
                  const labelTampil = `${w.blok}/${w.no_rumah} · ${w.nama}`;

                  return (
                    <div
                      key={w.id}
                      onClick={() => handleBukaUbah(w)}
                      className={`min-h-[56px] p-4 rounded-2xl border transition shadow-xs flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] ${
                        !w.aktif
                          ? 'bg-slate-100 border-slate-300 opacity-80'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[18px] sm:text-[20px] font-black text-slate-900 tracking-tight">
                        {labelTampil}
                      </span>

                      {!w.aktif && (
                        <Lencana warna="abu">
                          Nonaktif
                        </Lencana>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </main>

      {/* Lembar Tambah / Ubah Warga */}
      <LembarPenuh
        terbuka={lembarTerbuka}
        onTutup={() => setLembarTerbuka(false)}
        subJudul={wargaDiedit ? 'Ubah Data Rumah' : 'Tambah Rumah'}
        judul={wargaDiedit ? `${wargaDiedit.blok}/${wargaDiedit.no_rumah}` : 'Rumah Baru'}
      >
        {galatForm && <KotakGalat pesan={galatForm} />}

        <form onSubmit={handleSimpan} className="flex flex-col gap-4">
          {/* Pilihan Blok */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold uppercase tracking-wider text-slate-700">
              Pilih Blok:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['C0', 'C1', 'C2'] as const).map((b) => {
                const terpilih = formBlok === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFormBlok(b)}
                    className={`min-h-[56px] rounded-2xl font-black text-[20px] transition border-2 cursor-pointer ${
                      terpilih
                        ? 'bg-blue-950 text-white border-blue-950 shadow-md ring-2 ring-blue-300'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nomor Rumah */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="form-norumah"
              className="text-[14px] font-bold uppercase tracking-wider text-slate-700"
            >
              Nomor Rumah:
            </label>
            <input
              id="form-norumah"
              type="text"
              required
              value={formNoRumah}
              onChange={(e) => setFormNoRumah(e.target.value)}
              placeholder="Contoh: 01, 14, 25"
              className="w-full min-h-[56px] px-4 text-[20px] font-bold text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-blue-950 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Nama Warga */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="form-nama"
              className="text-[14px] font-bold uppercase tracking-wider text-slate-700"
            >
              Nama Warga:
            </label>
            <input
              id="form-nama"
              type="text"
              required
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="Contoh: HERU SURYA"
              className="w-full min-h-[56px] px-4 text-[20px] font-bold uppercase text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-blue-950 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2">
            <TombolBesar
              type="submit"
              variant="utama"
              memuat={memuatSimpan}
            >
              Simpan
            </TombolBesar>
          </div>

          {/* Tombol Nonaktifkan / Aktifkan Kembali (Bila Mode Ubah) */}
          {wargaDiedit && (
            <div className="pt-1">
              <TombolBesar
                type="button"
                variant={wargaDiedit.aktif ? 'bahaya' : 'sekunder'}
                memuat={memuatSimpan}
                onClick={handleUbahStatus}
              >
                {wargaDiedit.aktif ? 'Nonaktifkan rumah ini' : 'Aktifkan kembali'}
              </TombolBesar>
            </div>
          )}
        </form>
      </LembarPenuh>
    </div>
  );
}
