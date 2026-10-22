import { buatGalat, GalatApp } from './galat';

/**
 * Validasi apakah tanggal adalah hari Sabtu (ISO day 6).
 */
export function validasiHariSabtu(tanggalStr: string): GalatApp | null {
  if (!tanggalStr) {
    return buatGalat('SABTU_SALAH', 'Tanggal harus diisi.');
  }

  const parts = tanggalStr.split('-');
  if (parts.length !== 3) {
    return buatGalat('SABTU_SALAH', 'Format tanggal tidak valid (YYYY-MM-DD).');
  }

  const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  // 6 = Sabtu (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
  if (date.getDay() !== 6) {
    return buatGalat('SABTU_SALAH', 'Tanggal harus hari Sabtu.');
  }

  return null;
}

/**
 * Validasi jumlah setoran (harus bulat dan >= 0).
 */
export function validasiJumlahSetoran(jumlah: number): GalatApp | null {
  if (typeof jumlah !== 'number' || isNaN(jumlah) || !Number.isInteger(jumlah) || jumlah < 0) {
    return buatGalat('JUMLAH_TIDAK_VALID', 'Jumlah uang harus bilangan bulat positif atau Rp0.');
  }
  return null;
}

/**
 * Validasi bahwa dua petugas jaga tidak boleh orang yang sama.
 */
export function validasiPetugasJadwal(petugas1: string | null, petugas2: string | null): GalatApp | null {
  if (petugas1 && petugas2 && petugas1 === petugas2) {
    return buatGalat('PETUGAS_SAMA', 'Petugas 1 dan Petugas 2 tidak boleh orang yang sama.');
  }
  return null;
}
