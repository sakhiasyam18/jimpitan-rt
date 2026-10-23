import { ZONA_WAKTU } from './konstanta';

/**
 * Memeriksa apakah sebuah tanggal ISO (YYYY-MM-DD) jatuh pada hari Sabtu di zona waktu Asia/Jakarta.
 */
export function adalahSabtu(tanggalIso: string): boolean {
  if (!tanggalIso || !/^\d{4}-\d{2}-\d{2}$/.test(tanggalIso)) {
    return false;
  }

  const [year, month, day] = tanggalIso.split('-').map(Number);
  if (!year || !month || !day) return false;

  // Jam 12:00 UTC (19:00 WIB) memastikan hari kalender di Asia/Jakarta persis sesuai tanggal tersebut
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_WAKTU,
    weekday: 'short',
  });

  return formatter.format(date) === 'Sat';
}

/**
 * Memeriksa apakah nilai rupiah valid: bilangan bulat (integer) dan >= 0.
 */
export function adalahRupiahValid(n: unknown): boolean {
  return typeof n === 'number' && Number.isInteger(n) && !isNaN(n) && n >= 0;
}
