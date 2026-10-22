export type KodeGalat =
  | 'BELUM_LOGIN'
  | 'TIDAK_BERHAK'
  | 'SABTU_SALAH'
  | 'JUMLAH_TIDAK_VALID'
  | 'DATA_KEMBAR'
  | 'ISIAN_TIDAK_VALID'
  | 'PETUGAS_SAMA'
  | 'WARGA_NONAKTIF'
  | 'GAGAL_SERVER';

export interface GalatApp {
  error: {
    kode: KodeGalat;
    pesan: string;
    detail?: unknown;
  };
}

export function buatGalat(kode: KodeGalat, pesan: string, detail?: unknown): GalatApp {
  return {
    error: {
      kode,
      pesan,
      detail,
    },
  };
}
