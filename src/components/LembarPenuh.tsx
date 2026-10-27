'use client';

import React from 'react';

interface LembarPenuhProps {
  terbuka: boolean;
  onTutup: () => void;
  judul?: string;
  subJudul?: string;
  children: React.ReactNode;
}

export default function LembarPenuh({
  terbuka,
  onTutup,
  judul,
  subJudul,
  children,
}: LembarPenuhProps) {
  if (!terbuka) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center">
      <div
        className="w-full max-w-[480px] h-full sm:h-auto sm:max-h-[92vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Lembar Penuh */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            {subJudul && (
              <span className="text-[14px] font-bold uppercase tracking-wider text-emerald-400 block">
                {subJudul}
              </span>
            )}
            {judul && (
              <h2 className="text-[20px] sm:text-[22px] font-black tracking-tight truncate mt-0.5">
                {judul}
              </h2>
            )}
          </div>
          <button
            type="button"
            onClick={onTutup}
            className="min-h-[56px] min-w-[56px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-[16px] cursor-pointer flex items-center justify-center shrink-0"
          >
            Kembali
          </button>
        </div>

        {/* Konten Lembar */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}
