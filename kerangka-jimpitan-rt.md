# Jimpitan RT — Dokumen Kerangka

Aplikasi web mobile untuk mencatat jimpitan mingguan RT 23 RW 6, Kelurahan Munggut, Jalan Munggut Peni. Dokumen ini adalah acuan untuk dikerjakan di Antigravity. Semua keputusan di bawah sudah disepakati dengan client kecuali yang ditandai **[Belum final]**.

## 1. Ringkasan

**Masalah.** Jimpitan dicatat di buku manual. Bukunya kadang dibawa, kadang tidak, sehingga pencatatan tidak jalan dan tidak bisa dipantau.

**Solusi.** Aplikasi web mobile. Petugas yang jaga mencatat uang masuk per rumah lewat HP. Warga bisa melihat ringkasan live tanpa login.

**Pengguna.** Bapak-bapak generasi orang tua. Prioritas: tulisan besar, tombol besar, alur sesedikit mungkin.

**Skala.** Satu RT, 51 rumah, aplikasi lokal. Utamakan sederhana dan mudah diganti. Jangan menyiapkan fitur untuk kemungkinan yang jarang terjadi.

## 2. Aturan bisnis

- Pengambilan **seminggu sekali, hari Sabtu**.
- Iuran wajib **Rp2.000 per rumah per Sabtu**.
- Nominal yang diterima bebas (Rp2.000, Rp4.000, Rp6.000, dst.).
- **Kelebihan** dihitung sebagai saldo dan otomatis menutup Sabtu berikutnya.
- **Tunggakan** menumpuk tiap Sabtu yang belum tertutup.
- Rumah yang langganan nunggak harus terlihat jelas di tampilan petugas.
- Rumah yang dibayar dengan Rp0 berarti belum bayar.

### Rumus saldo (tidak disimpan, selalu dihitung)

```
kewajiban = iuran_per_minggu x jumlah_sabtu_sejak_tanggal_mulai (sampai Sabtu terbaru)
dibayar   = total jumlah semua setoran rumah itu
saldo     = dibayar - kewajiban
```

- `saldo >= 0`: aman, lebihnya menutup minggu berikutnya.
- `saldo < 0`: nunggak. Jumlah minggu nunggak = `ceil(abs(saldo) / iuran_per_minggu)`.
- Contoh: 5 Sabtu sudah lewat, total bayar Rp6.000. Kewajiban Rp10.000, saldo -Rp4.000, nunggak 2 minggu.
- Label **langganan nunggak** muncul jika nunggak >= `batas_langganan_nunggak` minggu. Nilai awal 3, bisa diubah di pengaturan. **[Belum final]**

Karena saldo selalu dihitung dari tabel `setoran`, tidak ada angka yang bisa tidak cocok.

## 3. Peran dan hak akses

Hanya ada **dua jenis pengunjung**.

| Pengunjung | Login | Bisa apa |
|---|---|---|
| Warga (publik) | Tidak | Hanya melihat ringkasan: petugas Sabtu ini, total terkumpul, progres, ringkasan per blok |
| Petugas | Ya | Mencatat dan mengubah setoran, mengatur jadwal jaga, mengelola data warga |

- Admin digabung dengan petugas. Semua petugas punya hak yang sama.
- Petugas bisa siapa saja dari warga, atau ditunjuk. Ada satu perwakilan yang biasanya menunjuk. **[Belum final: apakah perlu satu "pengatur jadwal" khusus. Untuk awal, semua petugas setara.]**
- Jaga bergilir, **2 orang per Sabtu**.

### Privasi publik

- Publik **tidak** melihat nama warga atau nominal per rumah.
- Publik hanya melihat angka ringkasan per blok dan jumlah yang nunggak. **[Belum final: apakah nama yang nunggak boleh tampil. Default: tidak tampil.]**

## 4. Teknologi

| Bagian | Pilihan |
|---|---|
| Framework | Next.js (App Router) + TypeScript (TSX) |
| Styling | Tailwind CSS, tanpa library UI berat |
| Database dan login | Supabase (Postgres + Auth) |
| Hosting | Vercel |
| Tampilan | Mobile-first |

Perintah awal:

```bash
npx create-next-app@latest jimpitan-rt --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd jimpitan-rt
npm install @supabase/supabase-js @supabase/ssr
```

Variabel lingkungan (`.env.local`, jangan di-commit):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 5. Struktur blok dan rumah

- 51 rumah, terbagi 3 blok: **C0 (29), C1 (2), C2 (20)**.
- Kunci unik rumah = **blok + nomor rumah**. Nomor kembar antarblok (mis. `/01` ada di C0 dan C2), dan ada nama mirip (HENDRO, HENDRA K, HENDRA W).
- Label rumah di seluruh aplikasi: `C0/17 · WIDI`.
- Nama blok disimpan sebagai teks biasa, jadi mudah diganti kalau client ingin sebutan lain (mis. P0/P1/P2). **[Belum final: apakah C0/C1/C2 sama dengan P0/P1/P2. Tidak memengaruhi logika.]**
- Daftar diurutkan otomatis: blok dulu, lalu nomor rumah.
- Nama berawalan "BU" ditampilkan apa adanya.

## 6. Rancangan tabel

Empat tabel data, ditambah satu tabel pengaturan kecil.

### `warga`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | primary key |
| blok | text | C0, C1, C2 |
| no_rumah | text | disimpan sebagai teks, mis. "01" |
| nama | text | |
| aktif | boolean | default true. Rumah pindah atau kosong dimatikan, bukan dihapus |
| | | unique (blok, no_rumah) |

### `akun_petugas`
Menghubungkan akun login ke warga. Dipakai untuk memeriksa siapa yang boleh mengubah data dan untuk kolom "dicatat oleh".

| Kolom | Tipe | Keterangan |
|---|---|---|
| user_id | uuid | primary key, mengacu ke `auth.users` |
| warga_id | uuid | mengacu ke `warga` |
| nama | text | nama tampil, mis. "Pak Heru" |
| aktif | boolean | default true. Nonaktifkan, jangan hapus |

### `jadwal`
Satu baris per Sabtu. Sengaja disederhanakan: tanpa tabel penghubung.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | primary key |
| tanggal | date | unique, harus hari Sabtu |
| petugas_1 | uuid | mengacu ke `warga` |
| petugas_2 | uuid | mengacu ke `warga` |
| catatan | text | opsional, mis. "libur, geser Minggu" |

Konsekuensi yang diterima: jumlah petugas tetap 2 per Sabtu. Kalau suatu saat butuh lebih, strukturnya diubah.

### `setoran`
Satu baris per rumah per Sabtu.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | primary key |
| tanggal | date | Sabtu yang bersangkutan |
| warga_id | uuid | mengacu ke `warga` |
| jumlah | integer | rupiah, >= 0. Rp0 = belum bayar |
| dicatat_oleh | uuid | mengacu ke `auth.users` |
| dicatat_pada | timestamptz | default now() |
| | | unique (tanggal, warga_id). Perubahan memakai upsert |

Kolom `dicatat_oleh` dan `dicatat_pada` untuk menelusuri kalau ada selisih, tanpa menuduh siapa pun.

### `pengaturan` (satu baris)
| Kolom | Nilai awal |
|---|---|
| iuran_per_minggu | 2000 |
| tanggal_mulai | Sabtu pertama aplikasi dipakai (diisi saat go-live) |
| batas_langganan_nunggak | 3 |

## 7. Keamanan dan akses data

- Aktifkan **Row Level Security** di semua tabel.
- Pengunjung tanpa login (anon) **tidak boleh membaca tabel langsung**.
- Beranda warga membaca lewat **fungsi database** (`security definer`) yang hanya mengembalikan angka ringkasan dan nama petugas Sabtu ini:
  - `ringkasan_publik()` mengembalikan total terkumpul minggu ini, jumlah rumah sudah bayar dari total, serta per blok: sudah bayar, total, dan jumlah nunggak.
  - Petugas Sabtu ini (2 nama) diambil dari `jadwal`.
- Petugas yang login dan aktif boleh baca dan tulis `warga`, `jadwal`, `setoran`, `pengaturan`.
- Pemeriksaan "petugas aktif" memakai `akun_petugas`.

### Login petugas (mudah untuk orang tua)

- Tampilan: kolom **nama** dan **PIN**.
- Di belakang layar tetap Supabase Auth: nama diubah menjadi email internal (mis. `heru@jimpitan.local`) dan PIN menjadi password.
- Supabase biasanya mensyaratkan password minimal 6 karakter, jadi **PIN 6 digit**.
- Akun petugas dibuat oleh pengelola lewat dashboard Supabase atau halaman khusus nanti.

## 8. Halaman

| Rute | Siapa | Isi |
|---|---|---|
| `/` | Publik | Beranda warga |
| `/login` | Petugas | Nama dan PIN |
| `/petugas` | Petugas | Daftar rumah + terima setoran |
| `/petugas/jadwal` | Petugas | Tabel jadwal jaga |
| `/petugas/warga` | Petugas | Data 51 rumah |

Rute `/petugas/*` harus mengalihkan ke `/login` kalau belum masuk.

### 8.1 Beranda warga `/`

- Judul "Jimpitan RT 23", sub-judul "RW 6 · Munggut Peni".
- Kartu **Petugas Sabtu ini** (tanggal + 2 nama).
- Dua angka besar: **Terkumpul** (rupiah) dan **Sudah bayar** (mis. 32 / 51).
- Bar progres.
- Daftar **per blok**: nama blok, sudah bayar / total, label jumlah nunggak (atau "lunas").
- Tautan kecil "Masuk untuk petugas".
- Tidak ada nama warga, tidak ada tombol ubah.

### 8.2 Daftar rumah petugas `/petugas`

- Kepala: tanggal Sabtu, nama petugas yang login, progres (mis. 32 / 51).
- Filter blok: tombol besar **Semua, C0, C1, C2**.
- Daftar rumah satu baris per rumah: label `C0/01 · AGUNG`, saldo, dan status Sabtu ini (nominal yang sudah diterima atau "Belum").
- Rumah nunggak: latar merah, tertulis jelas "nunggak N minggu". Rumah dengan label langganan nunggak diberi tanda lebih tegas.
- Tap rumah membuka layar terima setoran.

### 8.3 Layar terima setoran

- Nama rumah besar di atas, keterangan kekurangan (jika ada).
- Tombol nominal besar: **Rp2.000, Rp4.000, Rp6.000, Lainnya**. Nominal ini bisa diubah sesuai kebiasaan warga. **[Belum final: cocokkan dengan nominal yang sering dibayar.]**
- "Lainnya" membuka isian angka.
- Tombol **Simpan** besar.
- Bisa mengubah atau membatalkan setoran yang salah input (menimpa nilai atau mengatur ke Rp0).

### 8.4 Jadwal jaga `/petugas/jadwal`

- Tabel: Sabtu, Petugas 1, Petugas 2.
- Memilih petugas dari daftar akun petugas aktif.
- Opsional: tombol "isi 4 minggu ke depan" yang memutar daftar petugas secara berurutan, hasilnya tetap bisa diubah satu per satu.

### 8.5 Data warga `/petugas/warga`

- Daftar 51 rumah, bisa tambah, ubah, dan nonaktifkan.
- Tidak ada tombol hapus permanen.

## 9. Aturan tampilan (untuk orang tua)

- Ukuran huruf utama minimal 18px untuk nama rumah dan tombol, tidak ada teks di bawah 13px.
- Tombol minimal tinggi 56px, jarak antar tombol cukup agar tidak salah tap.
- Satu aksi utama per layar.
- Desain minimal: tanpa animasi berlebihan, kontras tinggi.
- Warna bermakna: merah = nunggak, hijau = sudah bayar, netral = lainnya.
- Bahasa Indonesia sehari-hari, kalimat pendek.
- Uji di layar HP kecil (lebar sekitar 360px).

## 10. Data awal (51 rumah)

Diimpor ke tabel `warga`. Catatan: "NU MARIJAN" mungkin salah ketik dari "NY MARIJAN", mohon konfirmasi sebelum go-live.

```sql
insert into warga (blok, no_rumah, nama) values
('C0','01','AGUNG'),('C0','04','GHON'),('C0','06','LULUK'),('C0','07','HELMI'),
('C0','08','AGUS'),('C0','11','MAHFUD'),('C0','14','BIANTO'),('C0','16','CUCUK'),
('C0','17','WIDI'),('C0','09','BU YULI'),('C0','18','ANDIK'),('C0','20','BU SRI'),
('C0','19','ROBI'),('C0','21','SUGENG'),('C0','22','ARIF FANDI'),('C0','23','MARSUDI'),
('C0','24','ANGGIT'),('C0','25','EKO YULI'),('C0','26','REDO'),('C0','27','UJIONO'),
('C0','33','MASRURI'),('C0','34','HENDRO'),('C0','36','WIWIN'),('C0','37','DEDI'),
('C0','35','NU MARIJAN'),('C0','30','BU RENI'),('C0','38','ARIF N'),('C0','39','SUTARTO'),
('C0','41','LASIMIN'),
('C1','02','HENDRA K'),('C1','06','TRI ANANTO'),
('C2','01','HENDRA W'),('C2','02','ANWAR'),('C2','06','HUTAPEA'),('C2','07','HERU SURYA'),
('C2','08','SUPARTO'),('C2','09','PUTHUT'),('C2','10','SUMADI'),('C2','05','BU MUHTAROM'),
('C2','12','SUWONDO'),('C2','14','ABDUL QODIR'),('C2','15','IMAN'),('C2','16','BU TOM'),
('C2','17','DAVIT'),('C2','18','SUPARMAN'),('C2','19','BU SOFNI'),('C2','20','BU HERU'),
('C2','22','EKO HARI'),('C2','23','SUKADI'),('C2','04','BU IRA'),('C2','11','BU BERNADUS');
```

Hitung ulang setelah impor: C0 = 29, C1 = 2, C2 = 20, total 51.

## 11. Struktur folder yang disarankan

```
src/
  app/
    page.tsx                 beranda publik
    login/page.tsx           login petugas
    petugas/page.tsx         daftar rumah + terima setoran
    petugas/jadwal/page.tsx  jadwal jaga
    petugas/warga/page.tsx   data warga
  components/                tombol besar, kartu, baris rumah, filter blok
  lib/
    supabase/                koneksi server dan client
    saldo.ts                 fungsi hitung saldo dan tunggakan
docs/
  kerangka-jimpitan-rt.md    dokumen ini
```

## 12. Urutan pengerjaan

1. **Fondasi.** Buat proyek, pasang Tailwind, siapkan koneksi Supabase.
2. **Database.** Buat tabel, RLS, fungsi `ringkasan_publik()`, impor 51 rumah.
3. **Login petugas.** Halaman login dan pengalihan rute `/petugas/*`.
4. **Inti.** Daftar rumah, filter blok, layar terima setoran, hitungan saldo dan tunggakan.
5. **Beranda warga.** Ringkasan publik dan petugas Sabtu ini.
6. **Jadwal jaga.** Tabel jadwal dan pilih petugas.
7. **Data warga.** Tambah, ubah, nonaktifkan.
8. **Uji langsung** dengan 2 sampai 3 bapak-bapak sebelum dipakai seluruh RT.

Versi pertama yang layak dipakai adalah langkah 1 sampai 5. Langkah 6 dan 7 bisa menyusul.

## 13. Risiko dan catatan

- **Supabase gratis mem-pause proyek** yang tidak aktif sekitar seminggu. Aplikasi dipakai tiap Sabtu sehingga biasanya aman, tetapi libur panjang (mis. Lebaran) bisa memicunya. Solusi: buat pengecekan terjadwal ringan (mis. ping harian) supaya proyek tetap aktif. Alternatif berbayar (Pro) dianggap berlebihan untuk satu RT.
- **Catatan siapa menginput** (`dicatat_oleh`, `dicatat_pada`) wajib ada, karena semua petugas setara.
- **Kesalahan input** harus mudah diperbaiki lewat edit setoran, jangan dipaksa lewat dashboard database.
- **Salah klik rumah** adalah risiko terbesar. Label blok + nomor + nama di setiap baris dan layar terima setoran untuk mengurangi itu.

## 14. Keputusan yang masih terbuka

| No | Pertanyaan | Default sementara |
|---|---|---|
| 1 | C0/C1/C2 sama dengan P0/P1/P2? | Pakai C0/C1/C2 |
| 2 | Nama warga yang nunggak tampil di publik? | Tidak, hanya ringkasan per blok |
| 3 | Batas minggu untuk label "langganan nunggak" | 3 minggu |
| 4 | Perlu satu "pengatur jadwal" khusus? | Tidak, semua petugas setara |
| 5 | Nominal tombol cepat | Rp2.000, Rp4.000, Rp6.000, Lainnya |
| 6 | Ejaan "NU MARIJAN" | Dipakai apa adanya |

## 15. Di luar cakupan (sengaja tidak dibuat)

- Pembayaran online atau integrasi bank.
- Notifikasi WhatsApp otomatis.
- Laporan keuangan yang rumit atau ekspor khusus.
- Peran berlapis (admin, bendahara, dll.).
- Lebih dari 2 petugas per Sabtu.

Bila kebutuhan di atas muncul kelak, tambahkan setelah versi dasar berjalan.
## 16. Desain API
 
API dibuat **setipis mungkin**. Tidak ada kumpulan endpoint untuk semua tabel.
 
### 16.1 Prinsip
 
| Hal | Pilihan | Alasan |
|---|---|---|
| Membaca data | Langsung di halaman (Server Components) | Tidak perlu endpoint terpisah, lebih cepat |
| Mengubah data | Server Actions | Tidak ada pintu publik tambahan yang perlu diamankan |
| Endpoint terbuka | Hanya **satu**: ringkasan publik | Supaya beranda warga bisa menyegarkan diri |
| Penjaga utama | Row Level Security di Supabase | Kalau kode salah, database tetap menolak |
| Hitungan saldo | **Satu sumber** di database (view/fungsi) | Angka di beranda warga dan layar petugas tidak mungkin berbeda |
 
Beranda warga menyegarkan data **tiap 30 detik** (polling). Tidak memakai real-time, karena cukup untuk kebutuhan RT dan lebih ringan.
 
### 16.2 Endpoint publik (tanpa login)
 
`GET /api/publik/ringkasan` membaca dari fungsi `ringkasan_publik()`.
 
```json
{
  "sabtu": "2026-10-24",
  "petugas": ["Pak Heru", "Pak Agung"],
  "terkumpul": 78000,
  "sudah_bayar": 32,
  "total_rumah": 51,
  "blok": [
    { "blok": "C0", "sudah": 18, "total": 29, "nunggak": 3 },
    { "blok": "C1", "sudah": 2,  "total": 2,  "nunggak": 0 },
    { "blok": "C2", "sudah": 12, "total": 20, "nunggak": 2 }
  ]
}
```
 
Tidak boleh ada nama warga atau nominal per rumah di respons ini.
 
### 16.3 Aksi petugas (wajib login)
 
| Aksi | Masukan | Hasil |
|---|---|---|
| `masuk` | nama, pin | Sesi petugas, arahkan ke `/petugas` |
| `keluar` | tidak ada | Kembali ke `/login` |
| Lihat daftar rumah | blok (opsional) | Daftar rumah + saldo + status Sabtu ini |
| `simpanSetoran` | warga_id, tanggal, jumlah | Setoran tersimpan (upsert per tanggal + warga) |
| Lihat jadwal | rentang tanggal | Baris Sabtu + 2 petugas |
| `aturJadwal` | tanggal, petugas_1, petugas_2, catatan | Jadwal tersimpan |
| `isiJadwalOtomatis` | tanggal_mulai, jumlah_minggu | Jadwal berputar berurutan, tetap bisa diubah |
| `simpanWarga` | blok, no_rumah, nama | Tambah atau ubah warga |
| `nonaktifkanWarga` | warga_id | Rumah tidak lagi dihitung |
| `ubahPengaturan` | iuran, batas_langganan_nunggak | Tersimpan |
 
"Batalkan setoran" tidak butuh aksi sendiri: cukup `simpanSetoran` dengan jumlah 0.
 
### 16.4 Bentuk data daftar rumah
 
Semua angka sudah dihitung di database. Aplikasi hanya menampilkan.
 
```json
{
  "tanggal": "2026-10-24",
  "rumah": [
    {
      "warga_id": "uuid",
      "label": "C0/06 · LULUK",
      "setoran_sabtu_ini": 0,
      "saldo": -6000,
      "minggu_nunggak": 3,
      "langganan_nunggak": true
    }
  ]
}
```
 
### 16.5 Aturan pemeriksaan input
 
- Tanggal setoran dan jadwal **harus hari Sabtu**.
- `jumlah` bilangan bulat, **>= 0**.
- Jumlah di atas **Rp50.000** meminta konfirmasi dulu (menangkap salah ketik, mis. kelebihan nol). Batas ini boleh diubah.
- Blok + nomor rumah tidak boleh kembar.
- `petugas_1` dan `petugas_2` tidak boleh orang yang sama.
- Rumah nonaktif tidak bisa diberi setoran baru.
- Pemeriksaan dilakukan di server **dan** di database (constraint/RLS), bukan hanya di tampilan.
### 16.6 Format kesalahan
 
Satu bentuk untuk semua, dengan pesan bahasa Indonesia yang langsung bisa ditampilkan ke orang tua.
 
```json
{ "error": { "kode": "SABTU_SALAH", "pesan": "Tanggal harus hari Sabtu." } }
```
 
| Kode HTTP | Artinya |
|---|---|
| 401 | Belum masuk |
| 403 | Akun tidak aktif atau tidak berhak |
| 409 | Data kembar (mis. blok + nomor rumah sudah ada) |
| 422 | Isian tidak valid |
 
Pesan layar dibuat sangat singkat, contoh: "PIN salah, coba lagi", bukan istilah teknis.
 
### 16.7 Keputusan perilaku (sudah disetujui)
 
1. **Setelah simpan setoran:** kembali otomatis ke daftar rumah. Rumah tadi langsung berubah status dan tidak lagi muncul sebagai "belum", sehingga petugas bisa lanjut ke rumah berikutnya tanpa langkah tambahan.
2. **Dua petugas mencatat rumah yang sama hampir bersamaan:** yang terakhir menimpa. `dicatat_oleh` dan `dicatat_pada` menunjukkan siapa yang terakhir mengubah. Tidak ada penguncian khusus.
### 16.8 Letak kode yang disarankan
 
```
src/
  app/
    api/publik/ringkasan/route.ts   endpoint publik
  actions/
    setoran.ts                      simpanSetoran
    jadwal.ts                       aturJadwal, isiJadwalOtomatis
    warga.ts                        simpanWarga, nonaktifkanWarga
    auth.ts                         masuk, keluar
    pengaturan.ts                   ubahPengaturan
  lib/
    validasi.ts                     aturan pemeriksaan input (16.5)
    galat.ts                        format kesalahan (16.6)
```
 
