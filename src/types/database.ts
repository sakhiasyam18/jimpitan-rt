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
