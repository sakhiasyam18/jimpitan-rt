'use client';

import React, { useState, useEffect } from 'react';
import { VSaldoWarga } from '@/types';
import { formatRupiah } from '@/lib/format';
import { NOMINAL_CEPAT } from '@/lib/konstanta-tampilan';
import { simpanSetoran } from '@/actions/setoran';
import TombolBesar from './TombolBesar';
import KotakGalat from './KotakGalat';

interface LayarTerimaSetoranProps {
  rumah: VSaldoWarga | null;
  terbuka: boolean;
  onTutup: () => void;
  onBerhasilSimpan: (rumahBaru: VSaldoWarga) => void;
}

export default function LayarTerimaSetoran({
  rumah,
  terbuka,
  onTutup,
  onBerhasilSimpan,
}: LayarTerimaSetoranProps) {
  const [nominalTerpilih, setNominalTerpilih] = useState<number | null>(null);
  const [modeLainnya, setModeLainnya] = useState<boolean>(false);
  const [inputLainnya, setInputLainnya] = useState<string>('');
  const [memuat, setMemuat] = useState<boolean>(false);
  const [galatPesan, setGalatPesan] = useState<string | null>(null);
  const [konfirmasiBesarTerbuka, setKonfirmasiBesarTerbuka] = useState<boolean>(false);

  useEffect(() => {
    if (rumah) {
      setNominalTerpilih(null);
      setModeLainnya(false);
      setInputLainnya('');
      setGalatPesan(null);
      setKonfirmasiBesarTerbuka(false);

      // Default jika sudah ada setoran
      if (rumah.sudah_dicatat_sabtu_ini && rumah.setoran_sabtu_ini > 0) {
        if (NOMINAL_CEPAT.includes(rumah.setoran_sabtu_ini)) {
          setNominalTerpilih(rumah.setoran_sabtu_ini);
        } else {
          setModeLainnya(true);
          setInputLainnya(rumah.setoran_sabtu_ini.toString());
        }
      } else {
        // Default awal ke nominal pertama (Rp2.000)
        setNominalTerpilih(NOMINAL_CEPAT[0] || 2000);
      }
    }
  }, [rumah]);

  if (!terbuka || !rumah) return null;

  const nominalFinal = modeLainnya
    ? parseInt(inputLainnya, 10) || 0
    : nominalTerpilih;

  async function eksekusiSimpan(jumlah: number, konfirmasiBesar = false) {
    if (!rumah) return;
    setMemuat(true);
    setGalatPesan(null);

    const hasil = await simpanSetoran({
      warga_id: rumah.warga_id,
      jumlah,
      konfirmasiBesar,
    });

    setMemuat(false);

    if (hasil.ok) {
      onBerhasilSimpan(hasil.data);
      onTutup();
    } else {
      if (hasil.error.kode === 'JUMLAH_BESAR') {
        setKonfirmasiBesarTerbuka(true);
      } else {
        setGalatPesan(hasil.error.pesan);
      }
    }
  }

  function handleSimpan(e: React.FormEvent) {
    e.preventDefault();
    if (nominalFinal === null) return;
    eksekusiSimpan(nominalFinal, false);
  }

  function handleBatalkanAtauNol() {
    eksekusiSimpan(0, false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center">
      <div
        className="w-full max-w-[480px] h-full sm:h-auto sm:max-h-[95vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kepala Layar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[14px] font-bold uppercase tracking-wider text-emerald-400">
              Terima dari
            </span>
            <button
              type="button"
              onClick={onTutup}
              className="min-h-[48px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[16px] cursor-pointer"
            >
              Kembali
            </button>
          </div>
          <h2 className="text-[22px] sm:text-[24px] font-black tracking-tight">
            {rumah.label}
          </h2>
        </div>

        {/* Isi Form */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Keterangan Saldo */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
            {rumah.saldo < 0 ? (
              <p className="text-[16px] sm:text-[18px] font-bold text-rose-700">
                Kurang {formatRupiah(-rumah.saldo)} ({rumah.minggu_nunggak} minggu)
              </p>
            ) : rumah.saldo > 0 ? (
              <p className="text-[16px] sm:text-[18px] font-bold text-emerald-800">
                Saldo lebih {formatRupiah(rumah.saldo)}
              </p>
            ) : (
              <p className="text-[16px] sm:text-[18px] font-bold text-slate-700">
                Saldo pas (Lunas)
              </p>
            )}

            {rumah.sudah_dicatat_sabtu_ini && (
              <p className="text-[13px] text-amber-800 font-bold mt-1.5 pt-1.5 border-t border-slate-200">
                Sudah tercatat {formatRupiah(rumah.setoran_sabtu_ini)} untuk Sabtu ini. Memilih lagi akan <strong className="underline">mengganti</strong>.
              </p>
            )}
          </div>

          {/* Kotak Galat jika ada */}
          {galatPesan && <KotakGalat pesan={galatPesan} />}

          {/* Konfirmasi Jumlah Besar jika muncul */}
          {konfirmasiBesarTerbuka ? (
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col gap-4">
              <p className="text-[20px] font-black text-amber-950 text-center">
                Jumlahnya {formatRupiah(nominalFinal || 0)}. Yakin?
              </p>
              <div className="flex flex-col gap-2.5">
                <TombolBesar
                  variant="utama"
                  memuat={memuat}
                  onClick={() => eksekusiSimpan(nominalFinal || 0, true)}
                >
                  Ya, simpan
                </TombolBesar>
                <TombolBesar
                  variant="sekunder"
                  onClick={() => setKonfirmasiBesarTerbuka(false)}
                >
                  Periksa lagi
                </TombolBesar>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSimpan} className="flex flex-col gap-4">
              <label className="text-[14px] font-bold uppercase tracking-wider text-slate-600">
                Pilih Nominal:
              </label>

              {/* Grid 2x2 Tombol Nominal Cepat */}
              <div className="grid grid-cols-2 gap-2.5">
                {NOMINAL_CEPAT.map((nominal) => {
                  const terpilih = !modeLainnya && nominalTerpilih === nominal;
                  return (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => {
                        setModeLainnya(false);
                        setNominalTerpilih(nominal);
                      }}
                      className={`min-h-[56px] py-3 rounded-2xl font-black text-[20px] transition border-2 cursor-pointer ${
                        terpilih
                          ? 'bg-blue-950 text-white border-blue-950 shadow-md ring-2 ring-blue-300'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {formatRupiah(nominal)}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setModeLainnya(true);
                    setNominalTerpilih(null);
                  }}
                  className={`min-h-[56px] py-3 rounded-2xl font-black text-[18px] transition border-2 cursor-pointer ${
                    modeLainnya
                      ? 'bg-blue-950 text-white border-blue-950 shadow-md ring-2 ring-blue-300'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Lainnya
                </button>
              </div>

              {/* Input Angka jika memilih Lainnya */}
              {modeLainnya && (
                <div className="mt-1 flex flex-col gap-1.5">
                  <label htmlFor="input-lainnya" className="text-[13px] font-bold text-slate-700">
                    Ketik nominal angka:
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] font-black text-slate-400">
                      Rp
                    </span>
                    <input
                      id="input-lainnya"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoFocus
                      value={inputLainnya}
                      onChange={(e) => setInputLainnya(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="w-full min-h-[56px] pl-12 pr-4 text-[22px] font-black text-slate-900 bg-white border-2 border-blue-950 rounded-2xl focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Tombol Terpisah Belum Bayar / Batalkan */}
              <div className="pt-2">
                <TombolBesar
                  type="button"
                  variant="sekunder"
                  memuat={memuat}
                  onClick={handleBatalkanAtauNol}
                >
                  {rumah.sudah_dicatat_sabtu_ini ? 'Batalkan setoran' : 'Belum bayar (Rp0)'}
                </TombolBesar>
              </div>

              {/* Tombol Utama Simpan */}
              <div className="pt-1">
                <TombolBesar
                  type="submit"
                  variant="utama"
                  memuat={memuat}
                  disabled={nominalFinal === null || (modeLainnya && !inputLainnya)}
                >
                  Simpan
                </TombolBesar>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
