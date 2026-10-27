# Prompt Antigravity: Tahap 2, Halaman dan Tampilan

Prasyarat: tahap 1 (API) selesai dan 14 pemeriksaannya lulus. Salin semua isi di bawah garis ini ke Antigravity.

---

## Tugas

Bangun **halaman dan tampilan** Jimpitan RT. Pengguna utama bapak-bapak generasi orang tua di HP: **tulisan besar, tombol besar, alur sependek mungkin**.

Baca dulu `AGENTS.md` dan `docs/spec-rilis-jimpitan-rt.md`, lalu kode di `src/actions`, `src/lib`, `src/types`. **Pakai apa adanya.** Bila ada yang kurang atau salah di sana, laporkan, jangan diperbaiki sendiri.

## Aturan tampilan (semua halaman)

- **Huruf:** teks utama ≥18px, nama rumah dan tombol 18 sampai 20px, angka penting ≥22px, tidak ada teks <13px.
- **Target ketuk** ≥56px tinggi, jarak antar tombol ≥8px. Satu aksi utama per layar, tombol utama penuh selebar layar dan pekat.
- **Tema terang saja** (`color-scheme: light`), kontras tinggi, **zoom diizinkan**. Lebar rancangan 360px, isi dipusatkan maksimum sekitar 480px.
- **Warna:** hijau = aman, kuning = belum (kurang 1 minggu), merah = nunggak (kurang ≥2 minggu), biru gelap = aksi utama. Selalu sertakan teks ("Belum", "Nunggak 3 minggu", "Lunas").
- **Format:** `Rp2.000`, tanggal `24 Okt 2026` dan `Sabtu, 24 Okt` (pakai `src/lib/format.ts`).
- Setiap daftar dan aksi punya keadaan **memuat** ("Memuat..."), **kosong** (kalimat penjelas), dan **galat** (kotak merah berisi `error.pesan` + tombol "Coba lagi").
- Setelah aksi berhasil, kotak hijau "Tersimpan" selama 2 detik (bukan pop-up kecil). Tombol yang sedang memproses dinonaktifkan dan berteks "Menyimpan...".
- Tanpa library UI, ikon, atau animasi. Tanpa animasi berlebihan, hover-only, atau gestur tersembunyi. `<html lang="id">`.
- **Jangan menghitung saldo atau tunggakan.** Tampilkan nilai dari `v_saldo_warga` dan `ringkasan_publik` apa adanya.
- **Jangan pernah menampilkan angka cadangan.** Bila data gagal dimuat, tampilkan "Data belum bisa dimuat. Coba lagi sebentar." tanpa angka.

## Halaman

### 1. Beranda warga `/` (tanpa login)
Server Component memuat `ringkasan_publik` untuk data awal; komponen client `BerandaLive` menyegarkan lewat `fetch('/api/publik/ringkasan')` tiap 30 detik dan berhenti saat tab tersembunyi. Penyegaran gagal: pertahankan data terakhir + tulisan kecil "Gagal menyegarkan". Data awal `null`: kotak "Data belum bisa dimuat" + tombol "Coba lagi".

Susunan:
1. "Jimpitan RT 23", sub-judul "RW 6 · Munggut Peni".
2. Kartu petugas: "Petugas jaga, {sabtu_jaga}" lalu nama dipisah " + ". Kosong: "Jadwal belum diisi".
3. Dua kartu angka: **Terkumpul** dan **Sudah bayar** (`32 / 51`), label "Rekap Sabtu {sabtu_rekap}". Bila `sabtu_rekap` ≠ `sabtu_jaga`, tampilkan keduanya jelas (mis. "Rekap Sabtu 17 Okt", "Jaga berikutnya 24 Okt").
4. Bar progres hijau (`sudah_bayar / total_rumah`) dengan teks persen.
5. "Per blok": satu baris per blok, `sudah / total`, lencana "lunas" (hijau) bila semua sudah atau "{n} nunggak" (kuning) bila `nunggak > 0`.
6. Tautan "Masuk untuk petugas".

Tidak ada nama warga, nominal per rumah, atau tombol ubah.

### 2. Login `/login`
Isian besar **Nama** dan **PIN** (`type="password"`, `inputmode="numeric"`, 6 digit) dengan label di atas isian. Tombol penuh "Masuk". Galat di kotak merah. Berhasil → `/petugas`; sudah login → langsung `/petugas`. Tautan "Kembali ke beranda".

### 3. Kerangka petugas `/petugas/*`
Layout bersama: kepala (nama petugas + "Keluar") dan **navigasi bawah tetap** 3 tab besar: Rumah, Jadwal, Warga. Beri ruang bawah agar isi tidak tertutup.

### 4. Daftar rumah `/petugas`
- Kepala: "Sabtu, {sabtu_terbaru}" dan "{sudah} / {total} sudah" (jumlah baris dengan `saldo >= 0`).
- Filter blok 4 tombol besar (Semua, C0, C1, C2) yang memanggil `daftarRumah(blok?)`. Kotak cari nama menyaring di sisi tampilan.
- Baris rumah (seluruh baris bisa diketuk): `label` tebal, di bawahnya "Kurang {Rp} · {n} minggu" (saldo < 0) / "Saldo lebih {Rp}" (saldo > 0) / "Pas". Lencana kanan: nominal hijau bila sudah dicatat > 0, "Rp0" abu bila dicatat 0, "Aman" hijau muda bila belum dicatat dan saldo ≥ 0, "Belum" kuning bila `minggu_nunggak = 1`.
- `minggu_nunggak >= 2`: latar merah muda dan "Nunggak {n} minggu" merah tebal. `langganan_nunggak`: tambah **"LANGGANAN NUNGGAK"** merah tebal.

**Layar terima setoran** (lembar penuh, bukan halaman baru):
- Tombol "Kembali" besar, "Terima dari" + `label` besar, keterangan kurang (merah) atau saldo lebih.
- Bila `sudah_dicatat_sabtu_ini`: "Sudah tercatat Rp{x} untuk Sabtu ini. Memilih lagi akan **mengganti**."
- Tombol nominal besar 2×2: `Rp2.000`, `Rp4.000`, `Rp6.000`, `Lainnya` (dari konstanta `NOMINAL_CEPAT` di `src/lib/konstanta-tampilan.ts`). Terpilih = pekat. `Lainnya` membuka isian angka (`inputmode="numeric"`, hanya digit).
- Tombol sekunder "Belum bayar (Rp0)", berlabel "Batalkan setoran" bila sudah tercatat (memanggil `simpanSetoran` dengan `jumlah: 0`).
- Tombol utama **Simpan** (aktif hanya bila nominal dipilih). Galat `JUMLAH_BESAR`: layar "Jumlahnya {Rp}. Yakin?" dengan "Ya, simpan" (ulang dengan `konfirmasiBesar: true`) dan "Periksa lagi".
- Berhasil: lembar tertutup, "Tersimpan", baris berubah memakai data terbaru dari aksi, **posisi gulir tidak melompat**. Galat lain tampil di dalam lembar.

### 5. Jadwal `/petugas/jadwal`
Panggil `ambilSabtuBerikutnya()`, bentuk 8 Sabtu (+7 hari, hitung UTC), `lihatJadwal` untuk rentang itu. Sabtu kosong tetap tampil. Tiap kartu: tanggal besar, dua `<select>` asli (tinggi ≥56px, huruf 18px) berisi `daftarPetugasAktif()` (yang sedang masuk ditandai "(Anda)"), tombol "Simpan". Tombol atas "Isi 4 minggu otomatis" dengan konfirmasi "Mengisi Sabtu yang masih kosong. Yang sudah terisi tidak diubah." Galat `PETUGAS_SAMA` tampil di kartunya. Gagal memuat: kotak galat + "Coba lagi", **jangan menebak tanggal dari jam perangkat**.

### 6. Data warga `/petugas/warga`
"{n} rumah aktif", daftar per blok (urut nomor), lencana "Nonaktif", saklar "Tampilkan yang nonaktif" (default mati). Ketuk baris → lembar ubah (Nama, Blok 3 tombol, No rumah, Simpan, "Nonaktifkan rumah ini" / "Aktifkan kembali"). "Tambah rumah" memakai lembar yang sama. **Tanpa tombol hapus.** Galat `RUMAH_KEMBAR` tampil di lembar.

## Berkas komponen yang diminta

`TombolBesar, KartuAngka, Lencana, BarProgres, KotakGalat, KotakBerhasil, LembarPenuh, BarisRumah, LayarTerimaSetoran, FilterBlok, BerandaLive` di `src/components/`, ditambah `src/lib/konstanta-tampilan.ts`. Hapus `src/app/uji/page.tsx`. Gunakan **satu** set client Supabase di `src/lib/supabase/`.

## Pemeriksaan wajib (laporkan lulus/gagal + alasan)

Di lebar 360px dengan satu akun petugas:

1. `/` tanpa login: petugas, terkumpul, `sudah / 51`, 3 baris blok, **tanpa nama warga**. Tanpa env: "Data belum bisa dimuat" tanpa angka.
2. Setelah mencatat setoran, beranda berubah dalam 30 detik tanpa muat ulang.
3. `/petugas` tanpa login → `/login`. PIN salah → "Nama atau PIN salah."
4. Daftar 51 rumah (C0 29, C1 2, C2 20), urut blok lalu nomor. Cari "hendr" menampilkan HENDRO, HENDRA K, HENDRA W dengan label blok.
5. Ketuk rumah, Rp2.000, Simpan: baris berubah, daftar tidak melompat.
6. Ketuk lagi, Rp6.000: tertulis "mengganti", tetap satu setoran. "Batalkan setoran" mengembalikan ke belum bayar.
7. 60.000 memunculkan konfirmasi; "Periksa lagi" tidak menyimpan.
8. Kurang ≥2 minggu berlatar merah muda; kurang 1 minggu berlencana kuning "Belum".
9. Jadwal: baris pertama = `rpc('sabtu_berikutnya')` (juga pada hari Minggu). Dua petugas sama → "Dua petugas harus orang berbeda." Isi otomatis 4 Sabtu tanpa menimpa.
10. Warga: tambah, ubah, nonaktifkan, aktifkan; blok + nomor kembar → "Blok dan nomor rumah ini sudah ada."
11. Tidak ada teks <13px, tombol <56px, atau gulir ke samping. Zoom jalan. Mode gelap perangkat tetap tampil terang dan terbaca.
12. Keluar → `/login`; tombol Kembali browser tidak membuka halaman petugas.
13. `npm run lint` dan `npm run build` lulus.

Sertakan tangkapan layar: beranda warga, daftar rumah, layar terima setoran.

## Jangan

- Jangan mengubah database, `src/actions`, atau `src/lib` (kecuali menambah `format.ts` dan `konstanta-tampilan.ts` bila belum ada).
- Jangan menambah dependensi, halaman, fitur, atau grafik di luar daftar.
- Jangan mempercantik berlebihan: yang dicari jelas dan mudah dipakai orang tua.
