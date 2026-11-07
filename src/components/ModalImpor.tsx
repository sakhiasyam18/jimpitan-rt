'use client';

import React, { useState } from 'react';
import { unduhTemplateWarga, unduhTemplateSetoran } from '@/lib/ekspor';
import { imporWargaBatch, BarisImporWarga } from '@/actions/warga';
import { imporSetoranBatch, BarisImporSetoran } from '@/actions/setoran';
import KotakBerhasil from './KotakBerhasil';
import KotakGalat from './KotakGalat';

interface ModalImporProps {
  terbuka: boolean;
  onTutup: () => void;
  onSelesai: () => void;
}

export default function ModalImpor({ terbuka, onTutup, onSelesai }: ModalImporProps) {
  const [tab, setTab] = useState<'warga' | 'setoran'>('warga');
  const [teksInput, setTeksInput] = useState<string>('');
  const [memuat, setMemuat] = useState<boolean>(false);
  const [pesanBerhasil, setPesanBerhasil] = useState<string | null>(null);
  const [pesanGalat, setPesanGalat] = useState<string | null>(null);
  const [rincianGalat, setRincianGalat] = useState<string[]>([]);

  if (!terbuka) return null;

  function resetState() {
    setTeksInput('');
    setPesanBerhasil(null);
    setPesanGalat(null);
    setRincianGalat([]);
  }

  function handleGantiTab(t: 'warga' | 'setoran') {
    setTab(t);
    resetState();
  }

  // Tangani pembacaan file .csv atau .txt dari input file
  function handleFilePilih(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setTeksInput(content);
      }
    };
    reader.readAsText(file);
  }

  // Fungsi pemecah baris CSV / TSV (mendukung koma, titik koma, atau tab dari copy-paste Excel)
  function parseBaris(teks: string): string[][] {
    const lines = teks
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return lines.map((line) => {
      // Deteksi pembatas: tab, titik koma, atau koma
      let pemisah = ',';
      if (line.includes('\t')) pemisah = '\t';
      else if (line.includes(';') && !line.includes(',')) pemisah = ';';

      return line.split(pemisah).map((cell) => cell.trim().replace(/^["']|["']$/g, ''));
    });
  }

  async function handleKirim() {
    if (!teksInput.trim()) {
      setPesanGalat('Masukkan teks atau pilih berkas CSV terlebih dahulu.');
      return;
    }

    setMemuat(true);
    setPesanBerhasil(null);
    setPesanGalat(null);
    setRincianGalat([]);

    const rawRows = parseBaris(teksInput);

    if (rawRows.length === 0) {
      setMemuat(false);
      setPesanGalat('Format data kosong atau tidak terbaca.');
      return;
    }

    // Periksa apakah baris pertama adalah judul kolom (Header)
    let startIndex = 0;
    const baris0 = rawRows[0].join(' ').toLowerCase();
    if (baris0.includes('blok') || baris0.includes('tanggal')) {
      startIndex = 1;
    }

    const dataRows = rawRows.slice(startIndex);

    if (dataRows.length === 0) {
      setMemuat(false);
      setPesanGalat('Hanya ditemukan baris judul. Silakan tambahkan data di bawahnya.');
      return;
    }

    if (tab === 'warga') {
      // Opsi A: Blok, No Rumah, Nama
      const daftarWarga: BarisImporWarga[] = dataRows.map((r) => ({
        blok: r[0] || '',
        no_rumah: r[1] || '',
        nama: r[2] || '',
      }));

      const res = await imporWargaBatch(daftarWarga);
      setMemuat(false);

      if (res.ok) {
        setPesanBerhasil(`Berhasil mengimpor ${res.data.berhasil} data warga.`);
        if (res.data.gagal > 0) {
          setRincianGalat(res.data.rincian);
        }
        onSelesai();
      } else {
        setPesanGalat(res.error.pesan);
      }
    } else {
      // Opsi B: Tanggal, Blok, No Rumah, Jumlah
      const daftarSetoran: BarisImporSetoran[] = dataRows.map((r) => ({
        tanggal: r[0] || '',
        blok: r[1] || '',
        no_rumah: r[2] || '',
        jumlah: parseInt(r[3] || '0', 10) || 0,
      }));

      const res = await imporSetoranBatch(daftarSetoran);
      setMemuat(false);

      if (res.ok) {
        setPesanBerhasil(`Berhasil mengimpor ${res.data.berhasil} catatan setoran.`);
        if (res.data.gagal > 0) {
          setRincianGalat(res.data.rincian);
        }
        onSelesai();
      } else {
        setPesanGalat(res.error.pesan);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border-2 border-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[13px] font-bold text-emerald-400 uppercase tracking-wider block">
              Alat Petugas
            </span>
            <h2 className="text-[20px] font-black text-white mt-0.5">
              Impor Berkas Excel / CSV
            </h2>
          </div>
          <button
            type="button"
            onClick={onTutup}
            className="min-h-[48px] min-w-[48px] px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-[16px] cursor-pointer flex items-center justify-center"
          >
            ✕ Tutup
          </button>
        </div>

        {/* Tab Pemilihan Opsi */}
        <div className="flex bg-slate-100 p-2 gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => handleGantiTab('warga')}
            className={`flex-1 min-h-[50px] py-2 px-3 rounded-xl font-black text-[15px] sm:text-[16px] cursor-pointer transition ${
              tab === 'warga'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Warga Baru (Opsi A)
          </button>
          <button
            type="button"
            onClick={() => handleGantiTab('setoran')}
            className={`flex-1 min-h-[50px] py-2 px-3 rounded-xl font-black text-[15px] sm:text-[16px] cursor-pointer transition ${
              tab === 'setoran'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Riwayat Setoran (Opsi B)
          </button>
        </div>

        {/* Konten Form */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-slate-800">
          {pesanBerhasil && <KotakBerhasil pesan={pesanBerhasil} />}
          {pesanGalat && <KotakGalat pesan={pesanGalat} />}

          {rincianGalat.length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-[14px] text-rose-950 flex flex-col gap-1 max-h-36 overflow-y-auto">
              <strong className="text-[15px] text-rose-900">Perhatian / Peringatan:</strong>
              {rincianGalat.map((err, idx) => (
                <div key={idx}>• {err}</div>
              ))}
            </div>
          )}

          {/* Panduan Format & Tombol Unduh Template */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[15px] font-bold text-slate-900 uppercase tracking-wider">
                Format Kolom:
              </span>
              <button
                type="button"
                onClick={tab === 'warga' ? unduhTemplateWarga : unduhTemplateSetoran}
                className="text-[14px] font-bold text-blue-900 hover:text-blue-950 underline cursor-pointer py-1"
              >
                📥 Unduh Contoh Template CSV
              </button>
            </div>

            {tab === 'warga' ? (
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Urutan: <strong>Blok, Nomor Rumah, Nama</strong><br />
                <span className="font-mono text-[13px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                  C2, 24, BAPAK JOKO
                </span>
              </p>
            ) : (
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Urutan: <strong>Tanggal, Blok, Nomor Rumah, Jumlah</strong><br />
                <span className="font-mono text-[13px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                  2026-10-24, C2, 07, 2000
                </span>
                <span className="block text-[13px] text-amber-800 font-semibold mt-1">
                  * Tanggal wajib hari Sabtu (format YYYY-MM-DD).
                </span>
              </p>
            )}
          </div>

          {/* Pilihan 1: Upload Berkas CSV */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[16px] font-bold text-slate-900">
              1. Pilih Berkas CSV dari HP/Laptop:
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFilePilih}
              className="min-h-[50px] p-2 border-2 border-slate-300 rounded-xl text-[15px] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[14px] file:font-bold file:bg-blue-950 file:text-white cursor-pointer"
            />
          </div>

          {/* Pilihan 2: Tempel Langsung Teks dari Excel */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="kotak-tempel" className="text-[16px] font-bold text-slate-900">
              2. Atau Tempel Langsung (Copy-Paste dari Excel):
            </label>
            <textarea
              id="kotak-tempel"
              rows={5}
              value={teksInput}
              onChange={(e) => setTeksInput(e.target.value)}
              placeholder={
                tab === 'warga'
                  ? 'Blok,Nomor Rumah,Nama\nC2,24,BAPAK JOKO\nC2,25,IBU SITI'
                  : 'Tanggal,Blok,Nomor Rumah,Jumlah\n2026-10-24,C2,07,2000\n2026-10-24,C2,08,2000'
              }
              className="w-full p-3 font-mono text-[14px] bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-blue-950 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Tombol Eksekusi */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center gap-3">
          <button
            type="button"
            onClick={resetState}
            disabled={memuat || !teksInput}
            className="min-h-[56px] px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[16px] rounded-2xl border border-slate-300 cursor-pointer"
          >
            Bersihkan
          </button>

          <button
            type="button"
            onClick={handleKirim}
            disabled={memuat || !teksInput.trim()}
            className={`flex-1 min-h-[56px] px-6 text-white rounded-2xl font-bold text-[18px] cursor-pointer flex items-center justify-center transition ${
              memuat || !teksInput.trim()
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98]'
            }`}
          >
            {memuat ? 'Memproses...' : 'Mulai Impor Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
