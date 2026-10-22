import { RumahWithStatus, Warga } from '@/types/database';

/**
 * Menghitung jumlah hari Sabtu di antara tanggal mulai dan tanggal sampai (inklusif).
 */
export function hitungJumlahSabtu(tanggalMulaiStr: string, tanggalSampaiStr: string): number {
  const mulai = new Date(tanggalMulaiStr);
  const sampai = new Date(tanggalSampaiStr);

  mulai.setHours(0, 0, 0, 0);
  sampai.setHours(0, 0, 0, 0);

  if (sampai < mulai) {
    return 0;
  }

  let count = 0;
  const curr = new Date(mulai);

  while (curr <= sampai) {
    // 6 = Sabtu (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
    if (curr.getDay() === 6) {
      count++;
    }
    curr.setDate(curr.getDate() + 1);
  }

  return count;
}

/**
 * Mendapatkan tanggal Sabtu terdekat yang relevan dalam format YYYY-MM-DD.
 * Jika hari ini adalah Sabtu, kembalikan hari ini.
 * Jika hari Minggu, kembalikan kemarin (Sabtu baru lewat).
 * Jika Senin - Jumat, kembalikan Sabtu mendatang.
 */
export function getSabtuTerkait(refDate: Date = new Date()): string {
  const d = new Date(refDate);
  const day = d.getDay(); // 0 = Min, 1 = Sen, ..., 6 = Sab

  if (day === 6) {
    // Hari ini Sabtu
    return toDateString(d);
  } else if (day === 0) {
    // Hari Minggu, gunakan Sabtu kemarin
    d.setDate(d.getDate() - 1);
    return toDateString(d);
  } else {
    // Senin - Jumat, arahkan ke Sabtu minggu ini
    const daysUntilSaturday = 6 - day;
    d.setDate(d.getDate() + daysUntilSaturday);
    return toDateString(d);
  }
}

/**
 * Konversi Date ke string format YYYY-MM-DD lokal
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format string tanggal YYYY-MM-DD ke teks bahasa Indonesia yang ramah dibaca
 * Contoh: "24 Oktober 2026" atau "Sabtu, 24 Okt 2026"
 */
export function formatTanggalIndonesia(tanggalStr: string, includeHari: boolean = true): string {
  if (!tanggalStr) return '-';
  const parts = tanggalStr.split('-');
  if (parts.length !== 3) return tanggalStr;

  const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };

  if (includeHari) {
    options.weekday = 'long';
  }

  return new Intl.DateTimeFormat('id-ID', options).format(date);
}

/**
 * Format angka ke format Rupiah standar, misal: Rp2.000
 */
export function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal).replace(/\s+/g, '');
}

/**
 * Membuat label identitas standar rumah RT 23: "C0/17 · WIDI"
 */
export function getLabelRumah(warga: Pick<Warga, 'blok' | 'no_rumah' | 'nama'>): string {
  return `${warga.blok}/${warga.no_rumah} · ${warga.nama}`;
}

/**
 * Menghitung status keuangan rumah (kewajiban, saldo, nunggak, langganan nunggak)
 */
export function hitungStatusRumah(
  warga: Warga,
  totalBayar: number,
  setoranSabtuIni: number | null,
  jumlahSabtu: number,
  iuranPerMinggu: number = 2000,
  batasLanggananNunggak: number = 3
): RumahWithStatus {
  const kewajiban = jumlahSabtu * iuranPerMinggu;
  const saldo = totalBayar - kewajiban;

  let mingguNunggak = 0;
  let statusLabel: 'lunas' | 'lebih' | 'nunggak' = 'lunas';

  if (saldo < 0) {
    mingguNunggak = Math.ceil(Math.abs(saldo) / iuranPerMinggu);
    statusLabel = 'nunggak';
  } else if (saldo > 0) {
    statusLabel = 'lebih';
  } else {
    statusLabel = 'lunas';
  }

  const isLanggananNunggak = mingguNunggak >= batasLanggananNunggak;

  return {
    ...warga,
    setoran_sabtu_ini: setoranSabtuIni,
    total_bayar: totalBayar,
    kewajiban,
    saldo,
    minggu_nunggak: mingguNunggak,
    is_langganan_nunggak: isLanggananNunggak,
    status_label: statusLabel,
  };
}

/**
 * Menghasilkan email internal untuk login dari nama petugas
 * Contoh: "Heru Surya" -> "heru-surya@jimpitan.local"
 */
export function namaToInternalEmail(nama: string): string {
  const sanitized = nama
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${sanitized || 'petugas'}@jimpitan.local`;
}
