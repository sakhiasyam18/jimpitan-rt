import React from 'react';

interface BarProgresProps {
  sudah: number;
  total: number;
  label?: string;
}

export default function BarProgres({ sudah, total, label = 'Progres' }: BarProgresProps) {
  const persen = total > 0 ? Math.min(100, Math.max(0, Math.round((sudah / total) * 100))) : 0;

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="w-full bg-slate-200 rounded-full h-[12px] overflow-hidden">
        <div
          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${persen}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center text-[14px] font-bold text-slate-600">
        <span>{label}</span>
        <span>{persen}%</span>
      </div>
    </div>
  );
}
