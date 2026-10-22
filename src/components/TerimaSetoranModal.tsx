'use client';

import { useState, useEffect } from 'react';
import { RumahWithStatus } from '@/types/database';
import { formatRupiah, getLabelRumah } from '@/lib/saldo';

interface TerimaSetoranModalProps {
  rumah: RumahWithStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (wargaId: string, nominal: number) => Promise<void>;
}

export default function TerimaSetoranModal({
  rumah,
  isOpen,
  onClose,
  onSave,
}: TerimaSetoranModalProps) {
  const [selectedNominal, setSelectedNominal] = useState<number | null>(null);
  const [customNominal, setCustomNominal] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (rumah) {
      const currentSabtu = rumah.setoran_sabtu_ini ?? 0;
      if (currentSabtu === 2000 || currentSabtu === 4000 || currentSabtu === 6000) {
        setSelectedNominal(currentSabtu);
        setIsCustom(false);
        setCustomNominal('');
      } else if (currentSabtu > 0) {
        setIsCustom(true);
        setSelectedNominal(null);
        setCustomNominal(currentSabtu.toString());
      } else {
        // default pilih 2000 untuk kemudahan
        setSelectedNominal(2000);
        setIsCustom(false);
        setCustomNominal('');
      }
    }
  }, [rumah]);

  if (!isOpen || !rumah) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rumah) return;

    let nominalToSave = 0;
    if (isCustom) {
      nominalToSave = parseInt(customNominal, 10) || 0;
    } else if (selectedNominal !== null) {
      nominalToSave = selectedNominal;
    }

    setSaving(true);
    try {
      await onSave(rumah.id, nominalToSave);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handleResetRp0() {
    setSelectedNominal(0);
    setIsCustom(false);
    setCustomNominal('0');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Rumah */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="min-w-0 pr-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
              Input Setoran Jimpitan
            </span>
            <h2 className="text-2xl font-black tracking-tight truncate mt-0.5">
              {getLabelRumah(rumah)}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xl shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status Keuangan Rumah */}
        <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-600">Kondisi Saldo:</span>
          {rumah.saldo < 0 ? (
            <span className="font-extrabold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg">
              ⚠️ Nunggak {rumah.minggu_nunggak} minggu ({formatRupiah(rumah.saldo)})
            </span>
          ) : rumah.saldo > 0 ? (
            <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
              ✓ Ada lebih {formatRupiah(rumah.saldo)}
            </span>
          ) : (
            <span className="font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              ✓ Lunas
            </span>
          )}
        </div>

        {/* Form Pilihan Nominal */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Pilih Nominal Uang Diterima:
            </label>

            {/* Grid Tombol Cepat Nominal Besar */}
            <div className="grid grid-cols-3 gap-2.5">
              {[2000, 4000, 6000].map((nominal) => {
                const isSelected = !isCustom && selectedNominal === nominal;
                return (
                  <button
                    key={nominal}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedNominal(nominal);
                    }}
                    className={`h-16 rounded-2xl font-extrabold text-lg flex flex-col items-center justify-center transition border-2 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 active:scale-95'
                    }`}
                  >
                    <span>{formatRupiah(nominal)}</span>
                    <span className="text-[11px] font-normal opacity-80">
                      {nominal / 2000} minggu
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tombol Lainnya & Belum Bayar */}
            <div className="grid grid-cols-2 gap-2.5 mt-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsCustom(true);
                  setSelectedNominal(null);
                }}
                className={`h-14 rounded-2xl font-bold text-base flex items-center justify-center transition border-2 cursor-pointer ${
                  isCustom
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ✏️ Nominal Lainnya
              </button>

              <button
                type="button"
                onClick={handleResetRp0}
                className={`h-14 rounded-2xl font-bold text-base flex items-center justify-center transition border-2 cursor-pointer ${
                  !isCustom && selectedNominal === 0
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                ❌ Belum (Rp0)
              </button>
            </div>

            {/* Input Manual Jika Memilih "Lainnya" */}
            {isCustom && (
              <div className="mt-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <label className="block text-xs font-bold text-emerald-900 mb-1">
                  Ketikkan Nominal Rupiah Bebas:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-500 text-lg">
                    Rp
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    step={1000}
                    min={0}
                    autoFocus
                    value={customNominal}
                    onChange={(e) => setCustomNominal(e.target.value)}
                    placeholder="Contoh: 10000"
                    className="w-full h-14 pl-12 pr-4 text-xl font-black text-slate-900 bg-white border-2 border-emerald-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tombol Simpan Setoran Besar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xl rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span>✓ Simpan Setoran</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
