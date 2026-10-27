import React from 'react';

interface KartuAngkaProps {
  label: string;
  nilai: string;
  subLabel?: string;
  warnaNilai?: 'hijau' | 'gelap' | 'biru';
}

export default function KartuAngka({
  label,
  nilai,
  subLabel,
  warnaNilai = 'gelap',
}: KartuAngkaProps) {
  let warnaText = 'text-slate-900';
  if (warnaNilai === 'hijau') {
    warnaText = 'text-emerald-700';
  } else if (warnaNilai === 'biru') {
    warnaText = 'text-blue-900';
  }

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col justify-between">
      <span className="text-[14px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <p className={`text-[24px] sm:text-[28px] font-black tracking-tight my-1 ${warnaText}`}>
        {nilai}
      </p>
      {subLabel && (
        <span className="text-[14px] text-slate-500 font-medium">
          {subLabel}
        </span>
      )}
    </div>
  );
}
