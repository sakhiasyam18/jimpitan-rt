import { ZONA_WAKTU } from './konstanta';

/**
 * Format angka ke Rupiah standar: Rp2.000 (titik ribuan, tanpa spasi, tanpa desimal)
 */
export function formatRupiah(n: number): string {
  const abs = Math.abs(Math.round(n || 0));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = n < 0 ? '-' : '';
  return `${sign}Rp${formatted}`;
}

const BULAN_PENDEK = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const HARI_INDONESIA = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

/**
 * Format tanggal ISO (YYYY-MM-DD) memakai zona Asia/Jakarta
 * format 'pendek' -> "24 Okt 2026"
 * format 'hari' -> "Sabtu, 24 Okt"
 */
export function formatTanggal(tglIso: string, format: 'pendek' | 'hari' = 'pendek'): string {
  if (!tglIso) return '-';
  const parts = tglIso.split('-');
  if (parts.length !== 3) return tglIso;

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  // Pakai jam 12:00 UTC (19:00 WIB) agar hari kalender di Asia/Jakarta persis sesuai tanggal tsb
  const date = new Date(Date.UTC(y, m, d, 12, 0, 0));

  const tglAngka = date.getUTCDate();
  const namaBulan = BULAN_PENDEK[date.getUTCMonth()] || '';
  const tahun = date.getUTCFullYear();
  const hariNama = HARI_INDONESIA[date.getUTCDay()] || '';

  if (format === 'hari') {
    return `${hariNama}, ${tglAngka} ${namaBulan}`;
  }

  return `${tglAngka} ${namaBulan} ${tahun}`;
}
