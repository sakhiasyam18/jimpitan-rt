# Jimpitan RT: Desain API

Kontrak antara tampilan dan server. Model data dan aturan bisnis ada di `docs/spec-rilis-jimpitan-rt.md`; skema di `supabase/jimpitan-final.sql`. Berkas ini hanya mendefinisikan **bentuk masukan, keluaran, dan galat**. Bila ada beda dengan spek, spek yang berlaku.

## 1. Prinsip

| Hal | Pilihan |
|---|---|
| Membaca data | Langsung di Server Component |
| Mengubah data | Server Actions (`src/actions/*`) |
| Endpoint HTTP | Hanya satu: `GET /api/publik/ringkasan` |
| Hitungan saldo | Hanya di DB (`v_saldo_warga`, `ringkasan_publik()`) |
| Penjaga akses | RLS di Supabase + `getUser()` di tiap aksi |

## 2. Tipe dasar

```ts
type Hasil<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: { kode: KodeGalat; pesan: string } };

type Blok = 'C0' | 'C1' | 'C2';
type Tanggal = string; // 'YYYY-MM-DD', selalu hari Sabtu untuk setoran dan jadwal
```

Aksi **tidak melempar galat** ke tampilan. Selalu mengembalikan `Hasil`.

## 3. Endpoint publik

`GET /api/publik/ringkasan` (tanpa login)

```ts
type RingkasanPublik = {
  sabtu_rekap: Tanggal;   // Sabtu terbaru yang sudah tiba, dasar "terkumpul"
  sabtu_jaga: Tanggal;    // Sabtu berikutnya (hari ini bila Sabtu), dasar "petugas"
  petugas: string[];      // 0 sampai 2 nama, kosong bila jadwal belum diisi
  terkumpul: number;      // rupiah di sabtu_rekap
  sudah_bayar: number;    // rumah aktif dengan saldo >= 0
  total_rumah: number;    // rumah aktif
  blok: { blok: Blok; total: number; sudah: number; nunggak: number }[];
};
```

- Sukses: `200` + `RingkasanPublik`. Header `Cache-Control: public, max-age=0, s-maxage=15, stale-while-revalidate=30`.
- Gagal: `500` + `{ error: { kode: 'GALAT_UMUM', pesan } }`. **Tidak ada data cadangan.**
- Tidak boleh memuat nama warga atau nominal per rumah.

## 4. Server Actions

Semua kecuali `masuk` memanggil `getUser()` dan mengembalikan `BELUM_MASUK` bila belum login.

### Auth

| Aksi | Masukan | Keluaran (`data`) |
|---|---|---|
| `masuk` | `{ nama: string; pin: string }` | `null`. Email = `nama` huruf kecil, spasi jadi titik, + `@jimpitan.local`. Akun nonaktif → `TIDAK_BERHAK`. Salah nama atau PIN → `LOGIN_GAGAL` |
| `keluar` | none | `null` |

### Setoran

```ts
type RumahSaldo = {
  warga_id: string; blok: Blok; no_rumah: string; nama: string; aktif: boolean; label: string; // 'C0/17 · WIDI'
  sabtu_terbaru: Tanggal;
  setoran_sabtu_ini: number; sudah_dicatat_sabtu_ini: boolean;
  dibayar: number; kewajiban: number; saldo: number;          // saldo < 0 = kurang
  minggu_nunggak: number; langganan_nunggak: boolean;
};
```

| Aksi | Masukan | Keluaran | Galat khas |
|---|---|---|---|
| `daftarRumah` | `{ blok?: Blok }` | `RumahSaldo[]` (aktif, urut blok lalu no_rumah numerik) | |
| `simpanSetoran` | `{ warga_id: string; jumlah: number; tanggal?: Tanggal; konfirmasiBesar?: boolean }` | `RumahSaldo` (baris terbaru) | `JUMLAH_TIDAK_VALID`, `JUMLAH_BESAR`, `SABTU_SALAH`, `RUMAH_TIDAK_AKTIF` |

`simpanSetoran`: `tanggal` default `sabtu_terbaru`. Bilangan bulat ≥ 0. `jumlah > 50000` tanpa `konfirmasiBesar` → `JUMLAH_BESAR`. Upsert `(tanggal, warga_id)`. Batal = `jumlah: 0`. `dicatat_oleh` dan `dicatat_pada` diisi trigger, jangan dikirim.

### Jadwal

```ts
type BarisJadwal = {
  tanggal: Tanggal;
  petugas_1: { warga_id: string; nama: string } | null;
  petugas_2: { warga_id: string; nama: string } | null;
  catatan: string | null;
};
type PetugasAktif = { user_id: string; warga_id: string | null; nama: string };
```

| Aksi | Masukan | Keluaran | Galat khas |
|---|---|---|---|
| `ambilSabtuBerikutnya` | none | `Tanggal` (dari `rpc('sabtu_berikutnya')`) | |
| `lihatJadwal` | `{ dari: Tanggal; sampai: Tanggal }` | `BarisJadwal[]` urut tanggal | |
| `daftarPetugasAktif` | none | `PetugasAktif[]` urut nama | |
| `aturJadwal` | `{ tanggal; petugas_1: string; petugas_2: string; catatan?: string }` (keduanya `warga_id`) | `BarisJadwal` | `SABTU_SALAH`, `PETUGAS_SAMA` |
| `isiJadwalOtomatis` | `{ tanggal_mulai: Tanggal; jumlah_minggu: number }` (maks 12) | `{ terisi: number; dilewati: number }` | `SABTU_SALAH`, `PETUGAS_KURANG` |

`isiJadwalOtomatis`: pasangan berurutan memutar dari petugas aktif (urut nama), melewati Sabtu yang sudah terisi.

### Warga

```ts
type Warga = { id: string; blok: Blok; no_rumah: string; nama: string; aktif: boolean };
```

| Aksi | Masukan | Keluaran | Galat khas |
|---|---|---|---|
| `daftarWarga` | `{ termasukNonaktif?: boolean }` | `Warga[]` urut blok, no_rumah | |
| `simpanWarga` | `{ id?: string; blok: Blok; no_rumah: string; nama: string }` | `Warga`. Tanpa `id` = tambah. `no_rumah` tetap teks ("01"), `nama` huruf besar | `RUMAH_KEMBAR` |
| `ubahStatusWarga` | `{ id: string; aktif: boolean }` | `Warga` | |

Tidak ada aksi hapus.

### Pengaturan

| Aksi | Masukan | Keluaran |
|---|---|---|
| `lihatPengaturan` | none | `{ iuran_per_minggu: number; tanggal_mulai: Tanggal \| null; batas_langganan_nunggak: number }` |
| `ubahPengaturan` | `{ iuran_per_minggu: number; batas_langganan_nunggak: number }` | pengaturan terbaru. `tanggal_mulai` tidak bisa diubah |

## 5. Kode galat

| Kode | Pesan untuk pengguna | Asal |
|---|---|---|
| `BELUM_MASUK` | Silakan masuk dulu. | tidak ada sesi |
| `TIDAK_BERHAK` | Akun ini tidak boleh melakukan ini. | akun nonaktif, RLS `42501` |
| `LOGIN_GAGAL` | Nama atau PIN salah. | login gagal |
| `SABTU_SALAH` | Tanggal harus hari Sabtu. | validasi atau `23514` memuat `tanggal_check`, `sabtu`, `isodow` |
| `JUMLAH_TIDAK_VALID` | Jumlah harus angka, nol atau lebih. | validasi atau `23514` memuat `jumlah_check` |
| `JUMLAH_BESAR` | Jumlahnya besar. Yakin? | di atas 50.000 tanpa konfirmasi |
| `RUMAH_TIDAK_AKTIF` | Rumah ini sedang tidak aktif. | trigger, pesan berawalan `RUMAH_TIDAK_AKTIF` |
| `RUMAH_KEMBAR` | Blok dan nomor rumah ini sudah ada. | `23505` pada `warga_blok_no_unik` |
| `PETUGAS_SAMA` | Dua petugas harus orang berbeda. | `23514` memuat `petugas_beda` |
| `PETUGAS_KURANG` | Petugas aktif belum cukup. | kurang dari 2 petugas aktif |
| `GALAT_UMUM` | Ada masalah. Coba lagi sebentar. | selain di atas. Detail ke `console.error` |

Pencocokan pesan Postgres tidak peka huruf besar-kecil.

## 6. Contoh alur: catat setoran

1. Tampilan memanggil `daftarRumah()` → `RumahSaldo[]`.
2. Petugas mengetuk C0/06, memilih Rp2.000, menekan Simpan → `simpanSetoran({ warga_id, jumlah: 2000 })`.
3. Server: `getUser()` → validasi → `upsert` → baca ulang `v_saldo_warga` → `{ ok: true, data: RumahSaldo }`.
4. Tampilan mengganti baris itu dengan data baru. Daftar tidak melompat.
5. Dalam ≤30 detik, beranda warga menampilkan angka terbaru dari `/api/publik/ringkasan`.
