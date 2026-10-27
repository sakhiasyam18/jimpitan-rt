# Jimpitan RT: Kerangka Produk

Dokumen untuk memahami **apa** yang dibuat dan **kenapa**. Detail teknis (tabel, API, keamanan, checklist rilis) ada di `spec-rilis-jimpitan-rt.md`. Bila ada beda, spesifikasi teknis yang berlaku.

## 1. Masalah dan solusi

**Masalah.** Jimpitan RT 23 RW 6 (Kelurahan Munggut, Jalan Munggut Peni) dicatat di buku manual. Bukunya kadang dibawa, kadang tidak, sehingga pencatatan tidak jalan dan tidak bisa dipantau.

**Solusi.** Aplikasi web untuk HP. Petugas yang jaga mencatat uang masuk per rumah. Warga bisa melihat ringkasan live tanpa login.

**Pengguna utama.** Bapak-bapak generasi orang tua. Karena itu: tulisan besar, tombol besar, alur sesedikit mungkin, desain sederhana.

**Skala.** Satu RT, 51 rumah. Aplikasi lokal. Utamakan sederhana dan mudah diganti, jangan menyiapkan fitur untuk kemungkinan yang jarang terjadi.

## 2. Aturan iuran

- Diambil **seminggu sekali, hari Sabtu**.
- Wajib **Rp2.000 per rumah per Sabtu**.
- Nominal yang diterima bebas (Rp2.000, Rp4.000, Rp6.000, dan seterusnya).
- **Kelebihan** menjadi saldo dan otomatis menutup Sabtu berikutnya.
- **Kekurangan** menumpuk sebagai tunggakan.
- Rp0 berarti belum bayar.

**Contoh.** Sudah 5 Sabtu, total bayar Rp6.000. Seharusnya Rp10.000, jadi kurang Rp4.000 (nunggak 2 minggu).

**Istilah status** (dipakai konsisten di seluruh tampilan):

| Status | Arti | Warna |
|---|---|---|
| Aman / Lunas | saldo nol atau lebih | hijau |
| Belum | kurang 1 minggu | kuning |
| Nunggak | kurang 2 minggu atau lebih | merah |
| Langganan nunggak | kurang 3 minggu atau lebih (angka bisa diubah) | merah, tulisan tegas |

Saldo dan tunggakan **tidak disimpan**, selalu dihitung dari catatan setoran. Jadi tidak ada angka yang bisa tidak cocok.

## 3. Siapa bisa apa

| Pengunjung | Login | Bisa |
|---|---|---|
| Warga (publik) | Tidak | Hanya melihat ringkasan |
| Petugas | Ya (nama + PIN 6 digit) | Mencatat setoran, mengatur jadwal, mengelola data warga |

- Hanya **satu jenis akun**: petugas. Admin digabung ke petugas, semua setara.
- Petugas bergilir, **2 orang per Sabtu**. Siapa saja bisa jadi petugas atau ditunjuk.
- Publik **tidak melihat nama warga** maupun nominal per rumah. Hanya angka per blok dan jumlah yang nunggak.

## 4. Blok dan rumah

51 rumah dalam 3 blok: **C0 (29), C1 (2), C2 (20)**. Data lengkap ada di `supabase/jimpitan-final.sql`.

- Kunci rumah = **blok + nomor rumah**, karena nomor bisa kembar antarblok (`/01` ada di C0 dan C2) dan ada nama mirip (HENDRO, HENDRA K, HENDRA W).
- Label tampil: `C0/17 · WIDI`.
- Daftar diurutkan blok dulu, lalu nomor rumah.
- Nama blok hanya label. Bila client ingin sebutan lain (mis. P0/P1/P2), cukup ubah data, logika tidak berubah.

## 5. Jadwal jaga

Sengaja dibuat paling sederhana: **satu baris per Sabtu**, berisi dua nama petugas yang dipilih dari daftar. Jumlah petugas tetap 2. Ada tombol "isi 4 minggu otomatis" yang memutar daftar petugas, hasilnya tetap bisa diubah.

## 6. Halaman

| Halaman | Untuk | Isi |
|---|---|---|
| Beranda `/` | Warga | Petugas jaga, total terkumpul, progres (mis. 32 / 51), ringkasan per blok |
| Login `/login` | Petugas | Nama dan PIN |
| Daftar rumah `/petugas` | Petugas | Daftar rumah dengan filter blok dan pencarian, lalu layar terima setoran |
| Jadwal `/petugas/jadwal` | Petugas | Pilih 2 petugas untuk tiap Sabtu |
| Data warga `/petugas/warga` | Petugas | Tambah, ubah, nonaktifkan rumah |

**Beranda warga.** Menampilkan dua tanggal: *Rekap* (Sabtu terbaru, untuk total terkumpul) dan *Jaga* (Sabtu berikutnya, untuk nama petugas). Pada hari Sabtu keduanya sama. Data menyegarkan diri tiap 30 detik.

**Terima setoran.** Petugas mengetuk rumah, memilih nominal besar (Rp2.000, Rp4.000, Rp6.000, Lainnya), lalu Simpan. Rumah yang salah input dikoreksi dengan menyimpan ulang. Membatalkan = simpan Rp0. Nominal di atas Rp50.000 meminta konfirmasi.

**Jejak.** Setiap setoran mencatat siapa dan kapan, supaya selisih bisa ditelusuri tanpa menuduh.

## 7. Prinsip tampilan

Mobile 360px, tema terang, zoom diizinkan. Huruf utama minimal 18px, tombol minimal 56px, satu aksi utama per layar. Warna selalu disertai teks. Bahasa Indonesia sehari-hari, kalimat pendek.

## 8. Status keputusan

**Sudah disepakati:** aturan iuran dan saldo, satu jenis akun, jadwal satu tabel, tampilan publik hanya ringkasan, stack (Next.js + Supabase + Vercel).

**Masih terbuka (default berlaku, bisa diubah belakangan):**

| Pertanyaan | Default |
|---|---|
| C0/C1/C2 sama dengan P0/P1/P2? | Pakai C0/C1/C2 |
| Nama warga yang nunggak tampil di publik? | Tidak, hanya ringkasan per blok |
| Batas "langganan nunggak" | 3 minggu |
| Perlu satu "pengatur jadwal" khusus? | Tidak, semua petugas setara |
| Nominal tombol cepat | 2.000 / 4.000 / 6.000 / Lainnya |
| Ejaan "NU MARIJAN" (mungkin "NY") | Apa adanya |

## 9. Di luar cakupan

Pembayaran online, notifikasi WhatsApp, laporan keuangan rumit, peran berlapis, lebih dari 2 petugas per Sabtu. Tambahkan setelah versi dasar berjalan, bila memang dibutuhkan.
