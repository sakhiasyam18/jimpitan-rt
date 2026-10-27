import React from 'react';

interface KotakGalatProps {
  pesan: string;
  onCobaLagi?: () => void;
}

export default function KotakGalat({ pesan, onCobaLagi }: KotakGalatProps) {
  if (!pesan) return null;

  return (
    <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        <span className="text-[20px] font-black shrink-0">⚠️</span>
        <p className="text-[16px] sm:text-[18px] font-bold leading-snug">
          {pesan}
        </p>
      </div>
      {onCobaLagi && (
        <button
          type="button"
          onClick={onCobaLagi}
          className="self-start min-h-[56px] px-5 py-3 bg-rose-800 hover:bg-rose-900 active:scale-95 text-white rounded-xl font-bold text-[16px] cursor-pointer flex items-center justify-center transition-transform"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}
