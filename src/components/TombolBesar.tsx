'use client';

import React from 'react';

interface TombolBesarProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'utama' | 'sekunder' | 'bahaya';
  memuat?: boolean;
  teksMemuat?: string;
  children: React.ReactNode;
}

export default function TombolBesar({
  variant = 'utama',
  memuat = false,
  teksMemuat = 'Menyimpan...',
  disabled,
  children,
  className = '',
  ...props
}: TombolBesarProps) {
  let styleVariant = 'bg-blue-950 text-white hover:bg-blue-900 border-transparent';
  if (variant === 'sekunder') {
    styleVariant = 'bg-white text-slate-800 border-2 border-slate-300 hover:bg-slate-100';
  } else if (variant === 'bahaya') {
    styleVariant = 'bg-rose-700 text-white hover:bg-rose-800 border-transparent';
  }

  return (
    <button
      {...props}
      disabled={disabled || memuat}
      className={`w-full min-h-[56px] px-4 py-3 rounded-2xl font-bold text-[18px] sm:text-[20px] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border ${styleVariant} ${className}`}
    >
      {memuat ? teksMemuat : children}
    </button>
  );
}
