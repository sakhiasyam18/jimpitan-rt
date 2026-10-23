'use client';

import React from 'react';

interface FilterBlokProps {
  blokTerpilih: string; // 'Semua' | 'C0' | 'C1' | 'C2'
  onPilihBlok: (blok: string) => void;
  disabled?: boolean;
}

export default function FilterBlok({
  blokTerpilih,
  onPilihBlok,
  disabled = false,
}: FilterBlokProps) {
  const daftarBlok = ['Semua', 'C0', 'C1', 'C2'];

  return (
    <div className="grid grid-cols-4 gap-2 w-full">
      {daftarBlok.map((blok) => {
        const isAktif = blokTerpilih === blok;
        return (
          <button
            key={blok}
            type="button"
            disabled={disabled}
            onClick={() => onPilihBlok(blok)}
            className={`min-h-[56px] rounded-2xl font-black text-[18px] transition flex items-center justify-center border-2 cursor-pointer ${
              isAktif
                ? 'bg-blue-950 text-white border-blue-950 shadow-md ring-2 ring-blue-300'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {blok}
          </button>
        );
      })}
    </div>
  );
}
