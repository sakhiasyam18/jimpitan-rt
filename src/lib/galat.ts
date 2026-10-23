import { Hasil } from '@/types';

export function sukses<T = null>(data: T): Hasil<T> {
  return { ok: true, data };
}

export function gagal(kode: string, pesan: string): Hasil<never> {
  return { ok: false, error: { kode, pesan } };
}

export function terjemahkanGalat(err: unknown): { kode: string; pesan: string } {
  if (!err) {
    return { kode: 'GALAT_UMUM', pesan: 'Ada masalah. Coba lagi sebentar.' };
  }

  // Jika sudah berupa objek { kode, pesan }
  if (typeof err === 'object' && err !== null && 'kode' in err && 'pesan' in err) {
    const e = err as { kode: string; pesan: string };
    return { kode: e.kode, pesan: e.pesan };
  }

  // Postgres / Supabase error object
  const anyErr = err as { code?: string; message?: string; details?: string };
  const code = anyErr.code || '';
  const message = anyErr.message || '';

  // 1. Akun nonaktif atau RLS menolak (42501)
  if (code === '42501') {
    return { kode: 'TIDAK_BERHAK', pesan: 'Akun ini tidak boleh melakukan ini.' };
  }

  // 2. Data kembar (23505)
  if (code === '23505') {
    return { kode: 'RUMAH_KEMBAR', pesan: 'Blok dan nomor rumah ini sudah ada.' };
  }

  // 3. Constraint violation (23514)
  if (code === '23514') {
    if (message.includes('petugas') || message.includes('jadwal_petugas_beda')) {
      return { kode: 'PETUGAS_SAMA', pesan: 'Dua petugas harus orang berbeda.' };
    }
    if (message.includes('sabtu') || message.includes('isodow')) {
      return { kode: 'SABTU_SALAH', pesan: 'Tanggal harus hari Sabtu.' };
    }
    if (message.includes('jumlah') || message.includes('>= 0')) {
      return { kode: 'JUMLAH_TIDAK_VALID', pesan: 'Jumlah harus angka, nol atau lebih.' };
    }
  }

  // 4. Rumah tidak aktif
  if (message.startsWith('RUMAH_TIDAK_AKTIF') || message.includes('tidak aktif')) {
    return { kode: 'RUMAH_TIDAK_AKTIF', pesan: 'Rumah ini sedang tidak aktif.' };
  }

  // 5. Fallback ke galat umum (log teknis ke console)
  console.error('[Galat tak dikenal Supabase/Postgres]:', err);
  return { kode: 'GALAT_UMUM', pesan: 'Ada masalah. Coba lagi sebentar.' };
}
