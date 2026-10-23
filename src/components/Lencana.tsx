import React from 'react';

interface LencanaProps {
  warna: 'hijau' | 'hijau-muda' | 'kuning' | 'merah' | 'abu';
  children: React.ReactNode;
  tebal?: boolean;
}

export default function Lencana({
  warna,
  children,
  tebal = false,
}: LencanaProps) {
  let styleColor = 'bg-slate-100 text-slate-800 border-slate-200';

  if (warna === 'hijau') {
    styleColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
  } else if (warna === 'hijau-muda') {
    styleColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (warna === 'kuning') {
    styleColor = 'bg-amber-100 text-amber-900 border-amber-300';
  } else if (warna === 'merah') {
    styleColor = 'bg-rose-100 text-rose-900 border-rose-300';
  } else if (warna === 'abu') {
    styleColor = 'bg-slate-100 text-slate-600 border-slate-300';
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-xl text-[14px] font-bold border ${styleColor} ${
        tebal ? 'font-black tracking-wide' : ''
      }`}
    >
      {children}
    </span>
  );
}
