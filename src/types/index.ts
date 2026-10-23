export type Hasil<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: { kode: string; pesan: string } };

export interface VSaldoWarga {
  warga_id: string;
  blok: 'C0' | 'C1' | 'C2' | string;
  no_rumah: string;
  nama: string;
  aktif: boolean;
  label: string;
  sabtu_terbaru: string;
  setoran_sabtu_ini: number;
  sudah_dicatat_sabtu_ini: boolean;
  dibayar: number;
  kewajiban: number;
  saldo: number;
  minggu_nunggak: number;
  langganan_nunggak: boolean;
}

export interface RingkasanPublikBlok {
  blok: string;
  total: number;
  sudah: number;
  nunggak: number;
}

export interface RingkasanPublikResponse {
  sabtu_rekap: string;
  sabtu_jaga: string;
  petugas: string[];
  terkumpul: number;
  sudah_bayar: number;
  total_rumah: number;
  blok: RingkasanPublikBlok[];
}

export interface WargaRow {
  id: string;
  blok: string;
  no_rumah: string;
  nama: string;
  aktif: boolean;
}

export interface AkunPetugasRow {
  user_id: string;
  warga_id: string | null;
  nama: string;
  aktif: boolean;
  created_at?: string;
}

export interface JadwalRow {
  id: string;
  tanggal: string;
  petugas_1: string | null;
  petugas_2: string | null;
  catatan?: string | null;
  petugas_1_nama?: string | null;
  petugas_2_nama?: string | null;
}

export interface PengaturanRow {
  id: number;
  iuran_per_minggu: number;
  tanggal_mulai: string;
  batas_langganan_nunggak: number;
  updated_at?: string;
}
