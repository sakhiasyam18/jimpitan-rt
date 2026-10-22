'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { INITIAL_WARGA } from '@/lib/mock-data';
import { Warga } from '@/types/database';
import { getLabelRumah } from '@/lib/saldo';

export default function DataWargaPage() {
  const [wargaList, setWargaList] = useState<Warga[]>(INITIAL_WARGA);
  const [selectedBlok, setSelectedBlok] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingWarga, setEditingWarga] = useState<Warga | null>(null);

  // Form states
  const [formBlok, setFormBlok] = useState<string>('C0');
  const [formNoRumah, setFormNoRumah] = useState<string>('');
  const [formNama, setFormNama] = useState<string>('');
  const [formAktif, setFormAktif] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function loadWarga() {
      setLoading(true);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setWargaList(INITIAL_WARGA);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('warga')
          .select('*')
          .order('blok')
          .order('no_rumah');

        if (!error && data && data.length > 0) {
          setWargaList(data);
        } else {
          setWargaList(INITIAL_WARGA);
        }
      } catch (err) {
        console.error(err);
        setWargaList(INITIAL_WARGA);
      } finally {
        setLoading(false);
      }
    }

    loadWarga();
  }, []);

  const filteredWarga = useMemo(() => {
    return wargaList.filter((w) => {
      const matchBlok = selectedBlok === 'Semua' || w.blok === selectedBlok;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        w.nama.toLowerCase().includes(q) ||
        w.no_rumah.toLowerCase().includes(q) ||
        `${w.blok}/${w.no_rumah}`.toLowerCase().includes(q);

      return matchBlok && matchQuery;
    });
  }, [wargaList, selectedBlok, searchQuery]);

  function handleOpenTambah() {
    setEditingWarga(null);
    setFormBlok(selectedBlok !== 'Semua' ? selectedBlok : 'C0');
    setFormNoRumah('');
    setFormNama('');
    setFormAktif(true);
    setFormError(null);
    setModalOpen(true);
  }

  function handleOpenUbah(w: Warga) {
    setEditingWarga(w);
    setFormBlok(w.blok);
    setFormNoRumah(w.no_rumah);
    setFormNama(w.nama);
    setFormAktif(w.aktif);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSaveWarga(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const cleanNo = formNoRumah.trim();
    const cleanNama = formNama.trim().toUpperCase();

    if (!cleanNo) {
      setFormError('Nomor rumah wajib diisi');
      return;
    }
    if (!cleanNama) {
      setFormError('Nama pemilik/penghuni wajib diisi');
      return;
    }

    setSaving(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      if (editingWarga) {
        // Mode Ubah
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient();
          const { error } = await supabase
            .from('warga')
            .update({
              blok: formBlok,
              no_rumah: cleanNo,
              nama: cleanNama,
              aktif: formAktif,
            })
            .eq('id', editingWarga.id);

          if (error) {
            setFormError('Gagal mengubah data: ' + error.message);
            setSaving(false);
            return;
          }
        }

        setWargaList((prev) =>
          prev.map((item) =>
            item.id === editingWarga.id
              ? {
                  ...item,
                  blok: formBlok,
                  no_rumah: cleanNo,
                  nama: cleanNama,
                  aktif: formAktif,
                }
              : item
          )
        );
        setNotification(`Data ${formBlok}/${cleanNo} · ${cleanNama} berhasil diperbarui!`);
      } else {
        // Mode Tambah Baru
        let newId = `warga-${Date.now()}`;
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('warga')
            .insert({
              blok: formBlok,
              no_rumah: cleanNo,
              nama: cleanNama,
              aktif: formAktif,
            })
            .select()
            .single();

          if (error) {
            setFormError('Gagal menambah rumah: ' + error.message);
            setSaving(false);
            return;
          }
          if (data) {
            newId = data.id;
          }
        }

        const newWargaItem: Warga = {
          id: newId,
          blok: formBlok,
          no_rumah: cleanNo,
          nama: cleanNama,
          aktif: formAktif,
        };

        setWargaList((prev) => [...prev, newWargaItem]);
        setNotification(`Rumah ${formBlok}/${cleanNo} · ${cleanNama} berhasil ditambahkan!`);
      }

      setModalOpen(false);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
      setFormError('Terjadi kesalahan saat menyimpan data');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-md mx-auto w-full border-x border-slate-300 pb-20 shadow-xl">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 sm:p-5 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
              Pengaturan RT 23
            </span>
            <h1 className="text-xl font-black truncate mt-0.5">
              🏠 Kelola Data Warga
            </h1>
          </div>
          <Link
            href="/petugas"
            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition"
          >
            ← Kembali
          </Link>
        </div>

        {/* Menu Navigasi Petugas */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-2 border-t border-slate-800 text-center text-xs font-bold">
          <Link
            href="/petugas"
            className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            📋 Setoran
          </Link>
          <Link
            href="/petugas/jadwal"
            className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            📅 Jadwal Jaga
          </Link>
          <Link
            href="/petugas/warga"
            className="py-2 rounded-xl bg-emerald-600 text-white shadow-xs"
          >
            🏠 Data Warga
          </Link>
        </div>
      </header>

      {/* Notifikasi */}
      {notification && (
        <div className="m-4 p-3 bg-emerald-600 text-white rounded-xl font-bold text-sm text-center shadow-md animate-in fade-in">
          ✓ {notification}
        </div>
      )}

      {/* Bar Filter & Tombol Tambah */}
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total {filteredWarga.length} Rumah
          </span>
          <button
            type="button"
            onClick={handleOpenTambah}
            className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Tambah Rumah</span>
          </button>
        </div>

        {/* Filter Blok */}
        <div className="grid grid-cols-4 gap-2">
          {['Semua', 'C0', 'C1', 'C2'].map((blok) => {
            const isSelected = selectedBlok === blok;
            return (
              <button
                key={blok}
                type="button"
                onClick={() => setSelectedBlok(blok)}
                className={`h-11 rounded-xl font-bold text-sm transition flex items-center justify-center cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {blok}
              </button>
            );
          })}
        </div>

        {/* Pencarian */}
        <div className="mt-2.5 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor atau nama warga..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* List Warga */}
      <main className="p-4 flex flex-col gap-2">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-bold">
            <span className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></span>
            <p>Memuat data warga...</p>
          </div>
        ) : filteredWarga.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-medium">
            Tidak ada rumah yang cocok
          </div>
        ) : (
          filteredWarga.map((w) => (
            <div
              key={w.id}
              onClick={() => handleOpenUbah(w)}
              className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 transition flex items-center justify-between gap-3 cursor-pointer shadow-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-slate-900">
                    {getLabelRumah(w)}
                  </span>
                  {!w.aktif && (
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                      Nonaktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Blok {w.blok} · Rumah No. {w.no_rumah}
                </p>
              </div>

              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                Ubah ✏️
              </span>
            </div>
          ))
        )}
      </main>

      {/* Modal Tambah / Ubah */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight">
                {editingWarga ? 'Ubah Data Rumah' : 'Tambah Rumah Baru'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveWarga} className="p-5 flex flex-col gap-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                  ⚠️ {formError}
                </div>
              )}

              {/* Blok */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Pilih Blok:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['C0', 'C1', 'C2'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFormBlok(b)}
                      className={`h-12 rounded-xl font-extrabold text-base border-2 cursor-pointer transition ${
                        formBlok === b
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nomor Rumah */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nomor Rumah:
                </label>
                <input
                  type="text"
                  required
                  value={formNoRumah}
                  onChange={(e) => setFormNoRumah(e.target.value)}
                  placeholder="Contoh: 01, 14, 25"
                  className="w-full h-12 px-3 text-base font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Nama Warga */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nama Warga / Kepala Rumah:
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: PAK HERU atau BU YULI"
                  className="w-full h-12 px-3 text-base font-bold uppercase bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Status Aktif */}
              <div className="pt-1">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAktif}
                    onChange={(e) => setFormAktif(e.target.checked)}
                    className="w-5 h-5 rounded accent-emerald-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">
                      Status Rumah Aktif
                    </span>
                    <span className="text-xs text-slate-400">
                      Nonaktifkan jika rumah kosong atau pindah (tidak dihapus permanen)
                    </span>
                  </div>
                </label>
              </div>

              {/* Tombol Simpan */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : '✓ Simpan Data Rumah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
