'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { keluar } from '@/actions/auth';
import ModalPanduan from '@/components/ModalPanduan';

export default function PetugasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [namaPetugas, setNamaPetugas] = useState<string>('Petugas');
  const [panduanTerbuka, setPanduanTerbuka] = useState<boolean>(false);

  useEffect(() => {
    async function ambilProfil() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profil } = await supabase
            .from('akun_petugas')
            .select('nama')
            .eq('user_id', user.id)
            .single();

          if (profil?.nama) {
            setNamaPetugas(profil.nama);
          } else if (user.email) {
            setNamaPetugas(user.email.split('@')[0]);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat profil petugas:', err);
      }
    }
    ambilProfil();
  }, []);

  async function handleKeluar() {
    await keluar();
    router.push('/login');
  }

  const tabs = [
    { href: '/petugas', label: 'Rumah' },
    { href: '/petugas/jadwal', label: 'Jadwal' },
    { href: '/petugas/warga', label: 'Warga' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-[480px] mx-auto w-full border-x border-slate-300">
      {/* Kepala Bersama */}
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-30 shadow-md flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[14px] font-bold uppercase tracking-wider text-emerald-400 block">
            Jimpitan RT 23
          </span>
          <p className="text-[18px] sm:text-[20px] font-black truncate mt-0.5">
            {namaPetugas}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPanduanTerbuka(true)}
            className="min-h-[56px] px-3.5 py-2 bg-blue-900 hover:bg-blue-800 active:scale-95 text-white rounded-xl text-[15px] font-bold border border-blue-700 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>❓</span>
            <span>Panduan</span>
          </button>
          <button
            type="button"
            onClick={handleKeluar}
            className="min-h-[56px] px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-xl text-[15px] font-bold border border-slate-700 cursor-pointer flex items-center justify-center"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Modal Panduan Petugas (Live Tutor) */}
      <ModalPanduan
        terbuka={panduanTerbuka}
        onTutup={() => setPanduanTerbuka(false)}
      />

      {/* Konten Halaman */}
      <div className="flex-1 pb-28">
        {children}
      </div>

      {/* Navigasi Bawah Tetap */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-300 shadow-xl max-w-[480px] mx-auto flex">
        {tabs.map((tab) => {
          const isAktif =
            tab.href === '/petugas'
              ? pathname === '/petugas'
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 min-h-[64px] flex flex-col items-center justify-center font-black text-[17px] sm:text-[18px] transition ${
                isAktif
                  ? 'bg-blue-950 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
