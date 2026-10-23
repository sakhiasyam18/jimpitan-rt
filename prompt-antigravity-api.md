# Prompt untuk Antigravity: Desain dan Implementasi API Jimpitan RT

Salin semua isi di bawah garis ini ke Antigravity. Letakkan juga `kerangka-jimpitan-rt.md` di folder `docs/` proyek agar bisa dibaca.

---

## Peran dan konteks

Kamu membangun bagian **data dan API** untuk aplikasi web mobile **Jimpitan RT** (RT 23 RW 6, Munggut Peni). Aplikasi ini dipakai bapak-bapak generasi orang tua untuk mencatat iuran mingguan Rp2.000 per rumah (51 rumah, blok C0/C1/C2) yang diambil tiap Sabtu.

Baca dulu `docs/kerangka-jimpitan-rt.md` untuk aturan bisnis dan halaman. Dokumen itu bagian 16 (Desain API) sudah **diperbarui oleh prompt ini**. Kalau ada beda, **prompt ini yang berlaku**.

Stack yang sudah ada: Next.js (App Router) + TypeScript + Tailwind, `@supabase/supabase-js`, `@supabase/ssr`. Repo: `sakhiasyam18/jimpitan-rt`.

## Aturan yang tidak boleh dilanggar

1. **Database sudah final.** Skema, RLS, view, dan fungsi sudah dibuat lewat `jimpitan-final.sql`. **Jangan mengubah skema, jangan membuat migrasi, jangan menulis SQL baru.** Kalau menemukan masalah, laporkan, jangan perbaiki sendiri.
2. **Hanya pakai `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.** Jangan memakai atau meminta service role key.
3. **Jangan menghitung saldo, tunggakan, atau jumlah minggu di kode TypeScript.** Semua hitungan ada di database (view `v_saldo_warga` dan fungsi `ringkasan_publik()`). Aplikasi hanya membaca dan menampilkan.
4. **Otorisasi memakai `supabase.auth.getUser()`**, bukan `getSession()`.
5. **Utamakan sederhana.** Tidak ada ORM, tidak ada state manager, tidak ada library UI. Jangan menambah fitur di luar daftar di bawah.
6. Semua pesan untuk pengguna **bahasa Indonesia, pendek, tanpa istilah teknis**.

## Yang sudah ada di database

Tabel: `warga`, `akun_petugas`, `jadwal`, `setoran`, `pengaturan`.

**View `v_saldo_warga`** (hanya bisa dibaca petugas login). Satu baris per rumah:

| Kolom | Arti |
|---|---|
| warga_id, blok, no_rumah, nama, aktif | data rumah |
| label | siap tampil, mis. `C0/17 · WIDI` |
| sabtu_terbaru | tanggal Sabtu yang sedang dicatat (hari ini bila Sabtu) |
| setoran_sabtu_ini | nominal yang sudah dicatat untuk `sabtu_terbaru` (0 bila belum) |
| sudah_dicatat_sabtu_ini | boolean, apakah sudah ada baris setoran di `sabtu_terbaru` |
| dibayar, kewajiban, saldo | rupiah. `saldo < 0` berarti kurang |
| minggu_nunggak | jumlah minggu yang masih kurang |
| langganan_nunggak | boolean, `minggu_nunggak >= batas` di tabel `pengaturan` |

**Fungsi `ringkasan_publik()`** (boleh dipanggil tanpa login), mengembalikan JSON:

```json
{
  "sabtu_rekap": "2026-10-24",
  "sabtu_jaga": "2026-10-24",
  "petugas": ["Pak Agung", "Pak Heru"],
  "terkumpul": 78000,
  "sudah_bayar": 32,
  "total_rumah": 51,
  "blok": [
    { "blok": "C0", "total": 29, "sudah": 18, "nunggak": 3 },
    { "blok": "C1", "total": 2,  "sudah": 2,  "nunggak": 0 },
    { "blok": "C2", "total": 20, "sudah": 12, "nunggak": 2 }
  ]
}
```

- `sabtu_rekap` = Sabtu terbaru yang sudah tiba (untuk total terkumpul).
- `sabtu_jaga` = Sabtu berikutnya (untuk nama petugas). Pada hari Sabtu keduanya sama.
- Di beranda warga tampilkan keduanya dengan jelas bila berbeda, mis. "Rekap Sabtu 17 Okt" dan "Jaga berikutnya 24 Okt".
- `sudah` = rumah dengan saldo >= 0. `nunggak` = rumah yang kurang >= 2 minggu.

Pemeriksaan di database yang akan menolak data salah (jangan diduplikasi aturannya, cukup terjemahkan galatnya, lihat bagian Galat):
- tanggal harus Sabtu, `jumlah >= 0`
- satu rumah satu setoran per Sabtu (`unique (tanggal, warga_id)`)
- blok + nomor rumah unik
- petugas 1 dan petugas 2 tidak boleh sama
- rumah nonaktif tidak bisa diberi setoran baru
- `dicatat_oleh` dan `dicatat_pada` diisi otomatis oleh database (jangan dikirim dari aplikasi)

## Yang harus dibangun

### 1. Koneksi Supabase (`src/lib/supabase/`)
- `server.ts`: client untuk Server Components, Server Actions, dan Route Handler (berbasis cookie, `@supabase/ssr`).
- `browser.ts`: client untuk komponen client (hanya bila benar-benar perlu).
- Penjaga sesi: cek versi Next.js di `package.json`. Gunakan `middleware.ts` (Next.js 15 ke bawah) atau `proxy.ts` (Next.js 16) untuk menyegarkan sesi dan mengalihkan `/petugas/*` ke `/login` bila belum masuk.

### 2. Endpoint publik: `src/app/api/publik/ringkasan/route.ts`
- `GET`, tanpa login.
- Memanggil `supabase.rpc('ringkasan_publik')` dan mengembalikan JSON apa adanya.
- Header: `Cache-Control: public, max-age=0, s-maxage=15, stale-while-revalidate=30`.
- Bila gagal: status 500 dengan format galat (lihat di bawah).
- **Ini satu-satunya route handler.** Semua yang lain Server Actions.

### 3. Server Actions (`src/actions/`)

Semua aksi mengembalikan tipe ini (tidak melempar galat ke tampilan):

```ts
type Hasil<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: { kode: string; pesan: string } };
```

Semua aksi selain `masuk` harus memanggil `getUser()` dulu. Bila belum masuk, kembalikan galat `BELUM_MASUK`.

**`auth.ts`**
- `masuk(nama, pin)`: ubah `nama` menjadi email internal `{nama huruf kecil, spasi jadi titik}@jimpitan.local` (satu konstanta `EMAIL_DOMAIN` di `src/lib/konstanta.ts`), lalu `signInWithPassword`. Setelah berhasil, baca `akun_petugas` miliknya; bila `aktif = false`, keluar lagi dan kembalikan `TIDAK_BERHAK`. Galat login selalu pesan umum: "Nama atau PIN salah." (jangan membedakan nama salah dan PIN salah).
- `keluar()`.

**`setoran.ts`**
- `daftarRumah(blok?: 'C0'|'C1'|'C2')`: baca `v_saldo_warga` dengan `aktif = true`, urutkan `blok`, lalu `no_rumah` (urutan angka, bukan huruf). Filter blok bila ada. Kembalikan semua kolom view.
- `simpanSetoran({ warga_id, jumlah, tanggal?, konfirmasiBesar? })`:
  - `tanggal` default = `sabtu_terbaru` (ambil dari `v_saldo_warga.sabtu_terbaru` atau `rpc('sabtu_terbaru')`). Boleh diisi hanya bila hari Sabtu.
  - `jumlah` harus bilangan bulat >= 0.
  - Bila `jumlah > 50000` dan `konfirmasiBesar` bukan `true`, kembalikan galat `JUMLAH_BESAR` agar tampilan meminta konfirmasi. Konstanta batas di `src/lib/konstanta.ts`.
  - Simpan dengan `upsert({ tanggal, warga_id, jumlah }, { onConflict: 'tanggal,warga_id' })`. **Jangan** mengirim `dicatat_oleh` atau `dicatat_pada`.
  - Setelah berhasil panggil `revalidatePath('/petugas')`, lalu kembalikan baris rumah yang terbaru dari `v_saldo_warga`.
  - Membatalkan setoran = memanggil aksi ini dengan `jumlah: 0`.

**`jadwal.ts`**
- `lihatJadwal(dari, sampai)`: baca `jadwal` dalam rentang tanggal, sertakan nama kedua petugas (join ke `warga`). Urut tanggal naik.
- `aturJadwal({ tanggal, petugas_1, petugas_2, catatan? })`: upsert berdasarkan `tanggal` (harus Sabtu). Tolak bila kedua petugas sama (`PETUGAS_SAMA`).
- `isiJadwalOtomatis({ tanggal_mulai, jumlah_minggu })`: ambil daftar petugas aktif dari `akun_petugas` (urut nama), bentuk pasangan berurutan memutar (petugas ke-1 dan ke-2, ke-3 dan ke-4, dst., kembali ke awal bila habis), isi tiap Sabtu mulai `tanggal_mulai`. **Lewati Sabtu yang sudah ada isinya.** Maksimal 12 minggu per panggilan. Butuh minimal 2 petugas aktif, bila kurang kembalikan `PETUGAS_KURANG`.
- `daftarPetugasAktif()`: baca `akun_petugas` aktif beserta `warga_id` untuk pilihan di jadwal.

Catatan: `petugas_1` dan `petugas_2` di tabel `jadwal` berisi **`warga_id`**, bukan `user_id`.

**`warga.ts`**
- `daftarWarga({ termasukNonaktif? })`: urut blok lalu no_rumah.
- `simpanWarga({ id?, blok, no_rumah, nama })`: tambah bila tanpa `id`, ubah bila ada. `blok` harus salah satu C0/C1/C2. `no_rumah` disimpan sebagai teks (jaga angka nol di depan, mis. "01"). `nama` dirapikan (trim, huruf besar semua agar seragam dengan data awal).
- `ubahStatusWarga(id, aktif)`: nonaktifkan atau aktifkan kembali. **Tidak ada aksi hapus.**

**`pengaturan.ts`**
- `lihatPengaturan()` dan `ubahPengaturan({ iuran_per_minggu, batas_langganan_nunggak })`. `tanggal_mulai` tidak boleh diubah dari aplikasi.

### 4. Validasi dan galat (`src/lib/`)
- `validasi.ts`: fungsi kecil `adalahSabtu(tanggalIso)`, `adalahRupiahValid(n)`. Hitung hari Sabtu memakai zona **Asia/Jakarta**, jangan zona perangkat.
- `galat.ts`: pembuat `Hasil` dan penerjemah galat Postgres/Supabase ke kode dan pesan Indonesia:

| Sumber | Kode | Pesan |
|---|---|---|
| belum login | `BELUM_MASUK` | "Silakan masuk dulu." |
| akun nonaktif atau RLS menolak (`42501`) | `TIDAK_BERHAK` | "Akun ini tidak boleh melakukan ini." |
| login gagal | `LOGIN_GAGAL` | "Nama atau PIN salah." |
| bukan hari Sabtu (`23514` pada constraint isodow, atau validasi) | `SABTU_SALAH` | "Tanggal harus hari Sabtu." |
| jumlah tidak valid | `JUMLAH_TIDAK_VALID` | "Jumlah harus angka, nol atau lebih." |
| jumlah > 50.000 tanpa konfirmasi | `JUMLAH_BESAR` | "Jumlahnya besar. Yakin?" |
| pesan berawalan `RUMAH_TIDAK_AKTIF` | `RUMAH_TIDAK_AKTIF` | "Rumah ini sedang tidak aktif." |
| `23505` pada `warga_blok_no_unik` | `RUMAH_KEMBAR` | "Blok dan nomor rumah ini sudah ada." |
| `23514` pada `jadwal_petugas_beda` atau validasi | `PETUGAS_SAMA` | "Dua petugas harus orang berbeda." |
| petugas aktif kurang dari 2 | `PETUGAS_KURANG` | "Petugas aktif belum cukup." |
| lainnya | `GALAT_UMUM` | "Ada masalah. Coba lagi sebentar." |

Galat tak dikenal dicatat di `console.error` (detail teknis), tetapi pengguna hanya melihat pesan umum.

### 5. Tipe (`src/types/`)
Tipe TypeScript untuk baris `v_saldo_warga`, respons `ringkasan_publik`, jadwal, warga, dan `Hasil<T>`.

## Struktur berkas yang diminta

```
src/
  app/api/publik/ringkasan/route.ts
  actions/
    auth.ts  setoran.ts  jadwal.ts  warga.ts  pengaturan.ts
  lib/
    supabase/server.ts  supabase/browser.ts
    konstanta.ts        (EMAIL_DOMAIN, BATAS_JUMLAH_BESAR = 50000, ZONA_WAKTU)
    validasi.ts  galat.ts
  types/index.ts
```

Halaman dan tampilan **belum** dikerjakan di tahap ini. Cukup sediakan fungsi di atas dan satu halaman uji sementara `src/app/uji/page.tsx` yang menampilkan hasil `ringkasan_publik` dan, bila sudah login, 5 baris pertama `daftarRumah()`. Hapus halaman itu setelah selesai.

## Cara menguji (wajib dijalankan dan dilaporkan)

Dengan satu akun petugas yang sudah dibuat di Supabase (email `{nama}@jimpitan.local`, PIN 6 digit):

1. `GET /api/publik/ringkasan` tanpa login mengembalikan JSON dengan `total_rumah = 51` dan **tidak** memuat nama warga.
2. Mengakses `/petugas` tanpa login dialihkan ke `/login`.
3. `masuk` dengan PIN salah mengembalikan `LOGIN_GAGAL`; PIN benar berhasil.
4. `daftarRumah()` mengembalikan 51 rumah, terurut blok lalu nomor (C0/01, C0/04, C0/06, ...).
5. `simpanSetoran` rumah C0/01 Rp2.000 berhasil; `setoran_sabtu_ini` jadi 2000 dan `saldo` naik.
6. `simpanSetoran` rumah yang sama Rp6.000 **menimpa** (tetap satu baris), bukan menambah.
7. `simpanSetoran` dengan jumlah 0 membatalkan; `jumlah = -1` ditolak `JUMLAH_TIDAK_VALID`.
8. `simpanSetoran` 60000 tanpa `konfirmasiBesar` mengembalikan `JUMLAH_BESAR`; dengan konfirmasi berhasil.
9. `tanggal` bukan Sabtu ditolak `SABTU_SALAH`.
10. `aturJadwal` dengan dua petugas sama ditolak `PETUGAS_SAMA`.
11. `isiJadwalOtomatis` 4 minggu mengisi 4 Sabtu berurutan dan tidak menimpa yang sudah ada.
12. Setelah langkah 5, `ringkasan_publik` menunjukkan `terkumpul` naik dan `sudah_bayar` bertambah.
13. Tanpa login, panggilan langsung ke tabel (`from('setoran').select()`) tidak mengembalikan data.

Laporkan hasil tiap nomor (lulus atau gagal beserta alasannya).

## Jangan lakukan

- Jangan membuat halaman final, desain, atau komponen tampilan (itu tahap berikutnya).
- Jangan membuat endpoint REST untuk tiap tabel.
- Jangan menyimpan saldo atau status di tabel baru.
- Jangan menambah dependensi baru tanpa alasan jelas. Bila perlu, sebutkan alasannya.
- Jangan commit `.env.local`.
