import React from 'react';

interface KotakBerhasilProps {
  pesan?: string;
}

export default function KotakBerhasil({ pesan = 'Tersimpan' }: KotakBerhasilProps) {
  if (!pesan) return null;

  return (
    <div className="w-full p-4 rounded-2xl bg-emerald-600 text-white font-black text-[18px] sm:text-[20px] text-center shadow-md flex items-center justify-center gap-2">
      <span>✓</span>
      <span>{pesan}</span>
    </div>
  );
}
