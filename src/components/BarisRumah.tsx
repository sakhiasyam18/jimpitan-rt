'use client';

import React from 'react';
import { VSaldoWarga } from '@/types';
import { formatRupiah } from '@/lib/format';
import Lencana from './Lencana';

interface BarisRumahProps {
  rumah: VSaldoWarga;
  onClick: (rumah: VSaldoWarga) => void;
}

export default function BarisRumah({ rumah, onClick }: BarisRumahProps) {
  const isNunggakBanyak = rumah.minggu_nunggak >= 2;
  const isBelumMingguIni = !rumah.sudah_dicatat_sabtu_ini;

  // Lencana kanan
  let lencanaWarna: 'hijau' | 'hijau-muda' | 'kuning' | 'merah' | 'abu' = 'abu';
  let lencanaTeks = '';

  if (rumah.sudah_dicatat_sabtu_ini && rumah.setoran_sabtu_ini > 0) {
    lencanaWarna = 'hijau';
    lencanaTeks = formatRupiah(rumah.setoran_sabtu_ini);
  } else if (rumah.sudah_dicatat_sabtu_ini && rumah.setoran_sabtu_ini === 0) {
    lencanaWarna = 'abu';
    lencanaTeks = 'Rp0';
  } else if (isBelumMingguIni && rumah.saldo >= 0) {
    lencanaWarna = 'hijau-muda';
    lencanaTeks = 'Aman';
  } else if (isBelumMingguIni && rumah.saldo < 0 && rumah.minggu_nunggak === 1) {
    lencanaWarna = 'kuning';
    lencanaTeks = 'Belum';
  } else if (isBelumMingguIni && rumah.saldo < 0 && rumah.minggu_nunggak >= 2) {
    lencanaWarna = 'merah';
    lencanaTeks = `Nunggak ${rumah.minggu_nunggak} minggu`;
  }

  // Teks saldo bawah kiri
  let infoSaldo = 'Pas';
  let styleInfoSaldo = 'text-slate-500 font-medium';

  if (rumah.saldo < 0) {
    if (isNunggakBanyak) {
      infoSaldo = `Kurang ${formatRupiah(-rumah.saldo)} · Nunggak ${rumah.minggu_nunggak} minggu`;
      styleInfoSaldo = 'text-rose-700 font-bold';
    } else {
      infoSaldo = `Kurang ${formatRupiah(-rumah.saldo)} · ${rumah.minggu_nunggak} minggu`;
      styleInfoSaldo = 'text-amber-700 font-bold';
    }
  } else if (rumah.saldo > 0) {
    infoSaldo = `Saldo lebih ${formatRupiah(rumah.saldo)}`;
    styleInfoSaldo = 'text-emerald-700 font-bold';
  }

  return (
    <div
      onClick={() => onClick(rumah)}
      className={`min-h-[64px] p-4 rounded-2xl border transition shadow-xs flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] ${
        isNunggakBanyak
          ? 'bg-rose-50/80 border-rose-300 hover:bg-rose-100/70'
          : 'bg-white border-slate-200 hover:bg-slate-50'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[18px] sm:text-[20px] font-black text-slate-900 tracking-tight truncate">
            {rumah.label}
          </h3>
          {rumah.langganan_nunggak && (
            <span className="text-[14px] font-black text-rose-700 bg-rose-200/80 px-2 py-0.5 rounded-md">
              LANGGANAN NUNGGAK
            </span>
          )}
        </div>
        <p className={`text-[14px] mt-0.5 ${styleInfoSaldo}`}>
          {infoSaldo}
        </p>
      </div>

      <div className="shrink-0">
        {lencanaTeks && (
          <Lencana warna={lencanaWarna} tebal={isNunggakBanyak}>
            {lencanaTeks}
          </Lencana>
        )}
      </div>
    </div>
  );
}
