'use client';

import React, { useState } from 'react';

interface ModalPanduanProps {
  terbuka: boolean;
  onTutup: () => void;
}

export default function ModalPanduan({ terbuka, onTutup }: ModalPanduanProps) {
  const [langkah, setLangkah] = useState<number>(1);

  if (!terbuka) return null;

  const totalLangkah = 4;

  const handleLanjut = () => {
    if (langkah < totalLangkah) {
      setLangkah(langkah + 1);
    } else {
      onTutup();
      setLangkah(1);
    }
  };

  const handleSebelumnya = () => {
    if (langkah > 1) {
      setLangkah(langkah - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="w-full max-w-[460px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border-2 border-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[13px] font-bold text-emerald-400 uppercase tracking-wider block">
              Panduan Petugas
            </span>
            <h2 className="text-[20px] font-black text-white mt-0.5">
              Langkah {langkah} dari {totalLangkah}
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

        {/* Progress Bar Langkah */}
        <div className="w-full bg-slate-200 h-2">
          <div
            className="bg-emerald-500 h-2 transition-all duration-300"
            style={{ width: `${(langkah / totalLangkah) * 100}%` }}
          />
        </div>

        {/* Isi Langkah */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-slate-800">
          {langkah === 1 && (
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-blue-900 font-bold text-[15px] w-fit">
                <span>🪙</span> Langkah 1: Mencatat Uang Masuk
              </div>
              <h3 className="text-[22px] font-black text-slate-900 leading-tight">
                Bagaimana cara mencatat jimpitan warga?
              </h3>
              <ol className="flex flex-col gap-3 mt-1 text-[17px] sm:text-[18px] text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-blue-950 text-white font-bold text-[16px] flex items-center justify-center mt-0.5">
                    1
                  </span>
                  <span>Di tab <strong>Rumah</strong>, cari nama atau nomor rumah warga (bisa pakai kotak cari atau filter blok).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-blue-950 text-white font-bold text-[16px] flex items-center justify-center mt-0.5">
                    2
                  </span>
                  <span><strong>Ketuk/klik baris rumah</strong> warga tersebut sampai muncul lembar setoran dari bawah.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-blue-950 text-white font-bold text-[16px] flex items-center justify-center mt-0.5">
                    3
                  </span>
                  <span>Pilih tombol nominal cepat (misal <strong>Rp2.000</strong>) lalu ketuk <strong>Simpan</strong>.</span>
                </li>
              </ol>
              <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-2xl text-emerald-950 text-[15px] font-semibold mt-1">
                ✅ Begitu tersimpan, status rumah otomatis berganti hijau dan jumlah warga yang sudah bayar langsung bertambah!
              </div>
            </div>
          )}

          {langkah === 2 && (
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-rose-900 font-bold text-[15px] w-fit">
                <span>⚠️</span> Langkah 2: Menangani Tunggakan
              </div>
              <h3 className="text-[22px] font-black text-slate-900 leading-tight">
                Melihat & Melunasi Tunggakan
              </h3>
              <p className="text-[17px] text-slate-700">
                Sistem otomatis menandai rumah yang belum bayar atau ada kekurangan:
              </p>
              <ul className="flex flex-col gap-2.5 text-[16px] sm:text-[17px]">
                <li className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950">
                  <strong>🟡 Lencana Kuning:</strong> Baru 1 minggu belum bayar (misal: <em>Kurang Rp2.000</em>).
                </li>
                <li className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
                  <strong>🔴 Lencana Merah:</strong> Nunggak 2 minggu atau lebih (misal: <em>Kurang Rp4.000</em>).
                </li>
              </ul>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[16px] text-slate-800">
                <strong>Cara Melunasi Susulan:</strong><br />
                Ketuk rumah yang nunggak ➔ Ketuk opsi <strong>&quot;Lainnya&quot;</strong> ➔ Masukkan nominal total yang dititipkan warga (misal Rp10.000) ➔ Klik <strong>Simpan</strong>. Tunggakan otomatis tertutup!
              </div>
            </div>
          )}

          {langkah === 3 && (
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-indigo-900 font-bold text-[15px] w-fit">
                <span>📅</span> Langkah 3: Jadwal & Warga
              </div>
              <h3 className="text-[22px] font-black text-slate-900 leading-tight">
                Jadwal Jaga & Data Warga
              </h3>
              <div className="flex flex-col gap-3 text-[17px] text-slate-700">
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <h4 className="font-bold text-slate-900 text-[18px]">Tab Jadwal:</h4>
                  <p className="text-[15px] text-slate-600 mt-1">
                    Melihat siapa 2 petugas yang berjaga di hari Sabtu. Bila ada petugas yang berhalangan, ketuk jadwal tersebut untuk menukar atau memilih warga pengganti.
                  </p>
                </div>
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <h4 className="font-bold text-slate-900 text-[18px]">Tab Warga:</h4>
                  <p className="text-[15px] text-slate-600 mt-1">
                    Digunakan untuk menambah penghuni baru, memperbarui nama kepala keluarga, atau menonaktifkan rumah yang sedang kosong.
                  </p>
                </div>
              </div>
            </div>
          )}

          {langkah === 4 && (
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-900 font-bold text-[15px] w-fit">
                <span>📥</span> Langkah 4: Layar HP & Laporan Excel
              </div>
              <h3 className="text-[22px] font-black text-slate-900 leading-tight">
                Aplikasi di Layar HP & Berkas
              </h3>
              <div className="flex flex-col gap-3 text-[16px] sm:text-[17px] text-slate-700">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="font-bold text-slate-950 text-[18px]">Pasang di Layar HP (Tinggal Klik):</h4>
                  <p className="text-[15px] text-slate-600 mt-1">
                    Buka Chrome di HP ➔ Klik titik tiga di kanan atas ➔ Pilih <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>. Ikon Jimpitan RT akan muncul di layar HP bapak-bapak!
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="font-bold text-slate-950 text-[18px]">Unduh Laporan & Impor Excel:</h4>
                  <p className="text-[15px] text-slate-600 mt-1">
                    Gunakan tombol <strong>&quot;Unduh Laporan Excel&quot;</strong> untuk pembukuan bendahara, atau tombol <strong>&quot;Impor Berkas&quot;</strong> jika ingin memasukkan data massal sekaligus.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Tombol Navigasi */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSebelumnya}
            disabled={langkah === 1}
            className={`min-h-[56px] px-5 rounded-2xl font-bold text-[17px] border cursor-pointer flex items-center justify-center ${
              langkah === 1
                ? 'opacity-40 bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
            }`}
          >
            ← Kembali
          </button>

          <button
            type="button"
            onClick={handleLanjut}
            className="flex-1 min-h-[56px] px-6 bg-blue-950 hover:bg-blue-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[18px] cursor-pointer flex items-center justify-center transition-transform"
          >
            {langkah === totalLangkah ? 'Selesai & Paham ✓' : 'Lanjut →'}
          </button>
        </div>
      </div>
    </div>
  );
}
