export interface Warga {
  id: string;
  blok: string;
  no_rumah: string;
  nama: string;
  aktif: boolean;
}

export interface AkunPetugas {
  user_id: string;
  warga_id: string | null;
  nama: string;
  aktif: boolean;
  created_at: string;
}

export interface Jadwal {
  id: string;
  tanggal: string; // YYYY-MM-DD
  petugas_1: string | null;
  petugas_2: string | null;
  catatan: string | null;
  // joined fields
  petugas_1_nama?: string;
  petugas_2_nama?: string;
}

export interface Setoran {
  id: string;
  tanggal: string; // YYYY-MM-DD
  warga_id: string;
  jumlah: number;
  dicatat_oleh: string | null;
  dicatat_pada: string;
}

export interface Pengaturan {
  id: number;
  iuran_per_minggu: number;
  tanggal_mulai: string;
  batas_langganan_nunggak: number;
  updated_at: string;
}

export interface BlokRingkasan {
  blok: string;
  total_rumah: number;
  sudah_bayar: number;
  nunggak: number;
}

export interface RingkasanPublikData {
  tanggal: string;
  petugas_1: string;
  petugas_2: string;
  catatan_jadwal: string | null;
  total_terkumpul: number;
  sudah_bayar_count: number;
  total_rumah: number;
  iuran_per_minggu: number;
  jumlah_sabtu: number;
  blok_ringkasan: BlokRingkasan[];
}

export interface RumahWithStatus extends Warga {
  setoran_sabtu_ini: number | null; // null jika belum ada input, 0 jika diisi 0, >0 jika sudah bayar
  total_bayar: number;
  kewajiban: number;
  saldo: number;
  minggu_nunggak: number;
  is_langganan_nunggak: boolean;
  status_label: 'lunas' | 'lebih' | 'nunggak';
}
