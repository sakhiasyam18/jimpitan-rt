# Prompt untuk Antigravity: Halaman dan Tampilan Jimpitan RT

Jalankan prompt ini **setelah** prompt API selesai dan 13 tesnya lulus. Salin semua isi di bawah garis ini ke Antigravity.

---

## Peran dan konteks

Kamu membangun **halaman dan tampilan** aplikasi **Jimpitan RT** (RT 23 RW 6, Munggut Peni). Pengguna utamanya bapak-bapak generasi orang tua yang membuka lewat HP. Prioritas: **tulisan besar, tombol besar, alur sependek mungkin, tidak membingungkan**.

Bacaan wajib sebelum mulai:
- `docs/kerangka-jimpitan-rt.md` (aturan bisnis, halaman, aturan tampilan di bagian 8 dan 9).
- Kode `src/actions/*`, `src/lib/*`, `src/types/*` yang sudah dibuat di tahap API. **Pakai apa adanya.**

## Aturan yang tidak boleh dilanggar

1. **Jangan mengubah database, `src/actions/*`, atau `src/lib/*`.** Kalau ada yang kurang atau salah, laporkan dan jangan memperbaikinya sendiri.
2. **Jangan menghitung saldo atau tunggakan di tampilan.** Tampilkan nilai dari `v_saldo_warga` dan `ringkasan_publik` apa adanya.
3. **Tailwind saja.** Tanpa library UI, tanpa library ikon, tanpa library animasi. Boleh memakai karakter teks sederhana sebagai penanda.
4. **Mobile-first**, dirancang untuk lebar **360px**. Di layar lebar, isi cukup dipusatkan dengan lebar maksimum sekitar 480px.
5. **Jangan memakai `localStorage` atau `sessionStorage`.**
6. Semua teks **bahasa Indonesia sehari-hari, kalimat pendek**. `<html lang="id">`.
7. Jangan menambah fitur di luar daftar halaman di bawah.

## Aturan tampilan (berlaku untuk semua halaman)

- **Huruf:** teks utama minimal 18px, nama rumah dan tombol 18 sampai 20px, angka penting 22px ke atas. Tidak ada teks di bawah 13px.
- **Tombol dan baris yang bisa diketuk:** tinggi minimal **56px**, jarak antar tombol minimal 8px.
- **Satu aksi utama per layar.** Tombol utama selalu penuh selebar layar dan berwarna pekat.
- **Kontras tinggi**, tema terang saja. Latar putih atau abu sangat muda, teks hampir hitam.
- **Warna punya arti tetap:**
  - hijau = sudah bayar atau aman
  - merah = nunggak
  - kuning = belum bayar minggu ini (belum nunggak)
  - biru gelap = aksi utama dan tautan
  - Jangan mengandalkan warna saja: selalu sertakan teks ("Belum", "Nunggak 3 minggu", "Lunas").
- **Format rupiah:** `Rp2.000` (titik ribuan, tanpa spasi, tanpa desimal). Buat satu fungsi `formatRupiah` di `src/lib/format.ts`.
- **Format tanggal:** `24 Okt 2026` dan `Sabtu, 24 Okt`. Buat `formatTanggal` di `src/lib/format.ts`, pakai zona Asia/Jakarta.
- **Keadaan memuat, kosong, dan galat harus ada** di setiap daftar dan aksi:
  - memuat: teks besar "Memuat..."
  - kosong: kalimat yang menjelaskan (mis. "Belum ada jadwal.")
  - galat: kotak merah besar berisi `error.pesan` dari `Hasil`, dengan tombol "Coba lagi"
- **Setelah aksi berhasil**, beri tanda singkat yang jelas (mis. kotak hijau "Tersimpan" selama 2 detik). Jangan memakai dialog pop-up kecil.
- Tombol yang sedang memproses dinonaktifkan dan teksnya berubah jadi "Menyimpan...", supaya tidak terketuk dua kali.
- Tanpa animasi berlebihan, tanpa hover-only, tanpa gestur geser yang tersembunyi.

## Halaman yang dibuat

### 1. Beranda warga `/` (tanpa login)

Server Component membaca `ringkasan_publik` untuk data awal, lalu komponen client menyegarkan lewat `fetch('/api/publik/ringkasan')` **tiap 30 detik**. Hentikan polling saat tab tidak terlihat. Bila penyegaran gagal, tampilkan data terakhir dan tulisan kecil "Gagal menyegarkan".

Susunan dari atas ke bawah:
1. Judul "Jimpitan RT 23", sub-judul "RW 6 · Munggut Peni".
2. **Kartu petugas** (latar biru muda): label "Petugas jaga, {tanggal sabtu_jaga}" lalu nama petugas dipisah " + ". Bila `petugas` kosong: "Jadwal belum diisi".
3. Dua kartu angka berdampingan: **Terkumpul** (`formatRupiah`) dan **Sudah bayar** (`32 / 51`). Di bawah keduanya label kecil "Rekap Sabtu {tanggal sabtu_rekap}". Bila `sabtu_rekap` berbeda dari `sabtu_jaga`, tampilkan kedua tanggal dengan jelas.
4. **Bar progres** dari `sudah_bayar / total_rumah`, warna hijau, tinggi 12px, dengan teks persen.
5. Judul "Per blok", lalu satu baris per blok: nama blok besar, `sudah / total`, dan lencana di kanan: "lunas" (hijau) bila semua sudah, atau "{n} nunggak" (kuning) bila `nunggak > 0`, selain itu kosong.
6. Tautan kecil di bawah: "Masuk untuk petugas" ke `/login`.

Tidak boleh ada nama warga, nominal per rumah, atau tombol ubah apa pun di halaman ini.

### 2. Login `/login`

- Judul "Masuk Petugas".
- Dua isian besar: **Nama** (huruf biasa, `autocapitalize="words"`) dan **PIN** (`type="password"`, `inputmode="numeric"`, 6 digit). Label jelas di atas tiap isian, bukan hanya placeholder.
- Tombol penuh "Masuk". Galat tampil di kotak merah dengan pesan dari `masuk()` ("Nama atau PIN salah.").
- Berhasil: alihkan ke `/petugas`. Bila sudah login dan membuka `/login`, langsung alihkan ke `/petugas`.
- Tautan kecil "Kembali ke beranda".

### 3. Kerangka petugas `/petugas/*`

Layout bersama untuk semua halaman petugas:
- **Navigasi bawah tetap** dengan 3 tab besar: **Rumah** (`/petugas`), **Jadwal** (`/petugas/jadwal`), **Warga** (`/petugas/warga`). Tab aktif jelas berbeda. Beri ruang bawah agar isi tidak tertutup.
- **Kepala** berisi nama petugas yang masuk dan tombol kecil "Keluar" (memanggil `keluar()`).

### 4. Daftar rumah `/petugas`

Ini halaman utama petugas.

Kepala daftar:
- "Sabtu, {tanggal sabtu_terbaru}" dan progres "{sudah} / {total} sudah". Hitung `sudah` hanya sebagai jumlah baris dengan `saldo >= 0` dari data yang diterima.
- **Filter blok:** empat tombol besar berdampingan 2×2 atau 4 kolom: Semua, C0, C1, C2. Yang aktif berwarna pekat. Memanggil `daftarRumah(blok?)`.
- **Kotak cari nama** (menyaring daftar di sisi tampilan, tanpa memanggil server lagi).

Baris rumah (satu rumah satu baris, bisa diketuk seluruhnya):
- Kiri: `label` tebal (mis. `C0/06 · LULUK`) dan baris kecil di bawahnya:
  - `saldo < 0`: "Kurang {formatRupiah(-saldo)} · {minggu_nunggak} minggu"
  - `saldo > 0`: "Saldo lebih {formatRupiah(saldo)}"
  - `saldo = 0`: "Pas"
- Kanan: lencana status Sabtu ini:
  - `sudah_dicatat_sabtu_ini` dan `setoran_sabtu_ini > 0`: hijau, `formatRupiah(setoran_sabtu_ini)`
  - `sudah_dicatat_sabtu_ini` dan `setoran_sabtu_ini = 0`: abu, "Rp0"
  - belum dicatat dan `saldo >= 0`: hijau muda, "Aman"
  - belum dicatat dan `saldo < 0` dengan `minggu_nunggak = 1`: kuning, "Belum"
- Rumah dengan `minggu_nunggak >= 2`: latar baris merah muda dan teks status merah tebal "Nunggak {n} minggu".
- Rumah dengan `langganan_nunggak = true`: tambahkan tulisan **"LANGGANAN NUNGGAK"** merah tebal pada baris, supaya tegas.

**Layar terima setoran** (lembar penuh layar yang muncul saat baris diketuk, bukan halaman baru):
- Kepala: tombol "Kembali" besar, lalu "Terima dari" dan `label` besar.
- Keterangan: kurang berapa bila `saldo < 0` ("Kurang Rp6.000 (3 minggu)", merah), atau saldo lebih bila ada.
- Bila `sudah_dicatat_sabtu_ini`: tampilkan "Sudah tercatat Rp{x} untuk Sabtu ini. Memilih lagi akan **mengganti**." supaya petugas paham ini koreksi.
- **Tombol nominal besar 2×2:** `Rp2.000`, `Rp4.000`, `Rp6.000`, `Lainnya`. Nominal ini diambil dari satu konstanta `NOMINAL_CEPAT = [2000, 4000, 6000]` di `src/lib/konstanta-tampilan.ts` agar mudah diganti. Tombol terpilih berubah warna pekat.
- `Lainnya` membuka isian angka besar (`inputmode="numeric"`), hanya digit.
- Tombol terpisah "Belum bayar (Rp0)" bergaya sekunder, memanggil `simpanSetoran` dengan `jumlah: 0`. Bila rumah sudah tercatat, tombol ini berlabel "Batalkan setoran".
- Tombol utama penuh **Simpan**, aktif hanya bila nominal sudah dipilih.
- Bila galat `JUMLAH_BESAR`: tampilkan layar konfirmasi besar "Jumlahnya {formatRupiah}. Yakin?" dengan dua tombol "Ya, simpan" dan "Periksa lagi". "Ya, simpan" memanggil ulang dengan `konfirmasiBesar: true`.
- Berhasil: tutup lembar, tampilkan "Tersimpan", baris rumah itu langsung berubah (pakai data baris terbaru yang dikembalikan aksi), **posisi gulir daftar tidak melompat**, dan petugas bisa langsung mengetuk rumah berikutnya.
- Galat lain: tampilkan `error.pesan` di kotak merah di dalam lembar, lembar tidak tertutup.

### 5. Jadwal `/petugas/jadwal`

- Judul "Jadwal Jaga".
- Daftar 8 Sabtu mulai dari `sabtu_berikutnya` ke depan (panggil `lihatJadwal` untuk rentang itu, Sabtu tanpa isi tetap ditampilkan sebagai baris kosong). Tiap baris berupa kartu: tanggal besar, lalu **dua pilihan petugas** (elemen `<select>` asli, tinggi minimal 56px, huruf 18px) dari `daftarPetugasAktif()`, dan tombol "Simpan" per kartu.
- Tombol di bagian atas "Isi 4 minggu otomatis" (memanggil `isiJadwalOtomatis`). Tampilkan konfirmasi singkat sebelum jalan: "Mengisi Sabtu yang masih kosong. Yang sudah terisi tidak diubah."
- Bila petugas 1 dan 2 sama: tampilkan galat `PETUGAS_SAMA` di kartu itu.
- Petugas yang sedang masuk ditandai "(Anda)" di pilihan.

### 6. Data warga `/petugas/warga`

- Judul "Data Warga", ringkasan "{n} rumah aktif".
- Daftar dikelompokkan per blok (judul blok sebagai pemisah), urut nomor rumah. Tiap baris: `label` dan lencana "Nonaktif" bila `aktif = false`.
- Saklar "Tampilkan yang nonaktif" (default mati).
- Mengetuk baris membuka lembar ubah: isian Nama, pilihan Blok (tombol C0/C1/C2), isian No rumah, tombol Simpan, dan tombol "Nonaktifkan rumah ini" / "Aktifkan kembali". Tidak ada tombol hapus.
- Tombol besar "Tambah rumah" di atas daftar membuka lembar yang sama dalam keadaan kosong.
- Galat `RUMAH_KEMBAR` tampil di dalam lembar.

## Struktur berkas yang diminta

```
src/
  app/
    layout.tsx                   (lang="id", viewport, judul "Jimpitan RT")
    page.tsx                     beranda warga
    login/page.tsx
    petugas/
      layout.tsx                 navigasi bawah + kepala
      page.tsx                   daftar rumah
      jadwal/page.tsx
      warga/page.tsx
  components/
    TombolBesar.tsx  KartuAngka.tsx  Lencana.tsx  BarProgres.tsx
    KotakGalat.tsx   KotakBerhasil.tsx  LembarPenuh.tsx
    BarisRumah.tsx   LayarTerimaSetoran.tsx  FilterBlok.tsx
    BerandaLive.tsx  (client, polling 30 detik)
  lib/
    format.ts                    formatRupiah, formatTanggal
    konstanta-tampilan.ts        NOMINAL_CEPAT
```

Hapus halaman uji `src/app/uji/page.tsx` yang dibuat di tahap API.

## Cara menguji (wajib dijalankan dan dilaporkan)

Uji di lebar 360px (alat pengembang browser atau HP asli) dengan satu akun petugas.

1. `/` tanpa login menampilkan petugas, terkumpul, `sudah / 51`, dan 3 baris blok, **tanpa nama warga**.
2. Setelah mencatat setoran di `/petugas`, beranda `/` memperbarui angka dalam 30 detik tanpa memuat ulang manual.
3. `/petugas` tanpa login dialihkan ke `/login`. Login berhasil mengarah ke `/petugas`. PIN salah menampilkan "Nama atau PIN salah.".
4. Daftar menampilkan 51 rumah, urut blok lalu nomor. Filter C0 hanya menampilkan 29, C1 hanya 2, C2 hanya 20.
5. Kotak cari "hendr" menampilkan HENDRO, HENDRA K, dan HENDRA W, masing-masing dengan label blok di depan.
6. Mengetuk rumah, memilih Rp2.000, Simpan: baris langsung berubah, daftar tidak melompat ke atas.
7. Mengetuk rumah yang sama lagi, memilih Rp6.000: tertulis jelas bahwa ini mengganti, dan hasilnya tetap satu setoran.
8. "Batalkan setoran" mengembalikan baris ke keadaan belum bayar.
9. Nominal 60.000 memunculkan konfirmasi besar; "Periksa lagi" tidak menyimpan.
10. Rumah dengan kurang >= 2 minggu berlatar merah muda dan bertulisan "Nunggak {n} minggu"; kurang 1 minggu berlencana kuning "Belum".
11. Halaman Jadwal: memilih dua petugas sama menampilkan "Dua petugas harus orang berbeda."; "Isi 4 minggu otomatis" mengisi 4 Sabtu tanpa menimpa yang sudah ada.
12. Halaman Warga: tambah rumah, ubah nama, nonaktifkan, lalu aktifkan kembali. Blok + nomor yang sudah ada menampilkan "Blok dan nomor rumah ini sudah ada.".
13. Tidak ada teks di bawah 13px, tidak ada tombol di bawah 56px tinggi, tidak ada gulir ke samping di lebar 360px.
14. Tombol Keluar mengembalikan ke `/login`, dan tombol Kembali di browser tidak membuka halaman petugas lagi.

Laporkan hasil tiap nomor (lulus atau gagal beserta alasannya), lalu sertakan tangkapan layar tiga halaman: beranda warga, daftar rumah, dan layar terima setoran.

## Jangan lakukan

- Jangan mengubah database, aksi, atau pustaka dari tahap API.
- Jangan menambah dependensi baru tanpa alasan. Bila perlu, sebutkan alasannya dulu.
- Jangan menambah halaman, fitur, atau grafik di luar daftar di atas.
- Jangan mempercantik berlebihan: yang dicari adalah jelas dan mudah dipakai orang tua, bukan tampilan yang ramai.
