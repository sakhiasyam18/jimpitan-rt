# Prompt Antigravity: Tahap 1, Data dan API

Prasyarat: `docs/spec-rilis-jimpitan-rt.md`, `docs/kerangka-jimpitan-rt.md`, `AGENTS.md`, dan `supabase/jimpitan-final.sql` sudah ada di proyek, dan SQL sudah dijalankan di Supabase. Salin semua isi di bawah garis ini ke Antigravity.

---

## Tugas

Bangun lapisan **data dan API** aplikasi Jimpitan RT (Next.js App Router + TypeScript + `@supabase/ssr`). Tampilan dikerjakan di tahap 2, jadi di sini **tanpa halaman final**.

Baca dulu `AGENTS.md`, `docs/spec-rilis-jimpitan-rt.md`, dan `docs/api-design.md` (kontrak tipe masukan/keluaran tiap aksi). Spesifikasi itu berlaku untuk model data, invarian, daftar aksi, kode galat, dan pemetaan galat Postgres. **Jangan mengulang atau mengubahnya**, cukup implementasikan.

## Yang dibangun

1. **`src/lib/supabase/server.ts`** (client berbasis cookie untuk Server Components, Server Actions, Route Handler) dan **`browser.ts`** (hanya bila perlu).
2. **`src/proxy.ts`** (Next.js 16; bila versi lebih lama, `middleware.ts`): menyegarkan sesi dan mengalihkan `/petugas/*` ke `/login` bila belum masuk. Cek dokumen Next di `node_modules/next/dist/docs/`.
3. **`src/app/api/publik/ringkasan/route.ts`**: `GET` memanggil `rpc('ringkasan_publik')`, mengembalikan JSON apa adanya dengan header cache dari spek. Galat: 500 + `{ error: { kode, pesan } }`.
4. **`src/actions/`**: `auth.ts`, `setoran.ts`, `jadwal.ts`, `warga.ts`, `pengaturan.ts` dengan **semua 14 aksi** di `docs/api-design.md` (nama, masukan, dan keluaran harus persis sama). Semua mengembalikan `Hasil<T>`.
5. **`src/lib/`**:
   - `konstanta.ts`: `EMAIL_DOMAIN = 'jimpitan.local'`, `BATAS_JUMLAH_BESAR = 50000`, `ZONA_WAKTU = 'Asia/Jakarta'`
   - `validasi.ts`: `adalahSabtu(tanggalIso)` dan `adalahRupiahValid(n)` (hitung di zona Asia/Jakarta)
   - `galat.ts`: pembuat `Hasil` dan penerjemah galat Postgres/Supabase sesuai tabel pemetaan di spek
   - `format.ts`: `formatRupiah`, `formatTanggal` (WIB)
6. **`src/types/`**: tipe untuk baris `v_saldo_warga`, respons `ringkasan_publik`, jadwal, warga, `Hasil<T>`. Tanpa `any`.
7. **Halaman uji sementara** `src/app/uji/page.tsx`: menampilkan hasil `ringkasan_publik` dan, bila sudah login, 5 baris pertama `daftarRumah()`. **Hapus setelah selesai.**

## Detail penting

- `masuk(nama, pin)`: email = nama huruf kecil, spasi jadi titik, + `@EMAIL_DOMAIN`. Setelah `signInWithPassword` berhasil, baca `akun_petugas`; bila `aktif=false`, keluar lagi dan kembalikan `TIDAK_BERHAK`. Galat login selalu `LOGIN_GAGAL` ("Nama atau PIN salah."), tidak membedakan nama dan PIN.
- `simpanSetoran`: `tanggal` default `sabtu_terbaru`. `jumlah` bilangan bulat >= 0. Di atas `BATAS_JUMLAH_BESAR` tanpa `konfirmasiBesar` → `JUMLAH_BESAR`. `upsert({ tanggal, warga_id, jumlah }, { onConflict: 'tanggal,warga_id' })`. **Jangan** kirim `dicatat_oleh` atau `dicatat_pada`. Setelah berhasil `revalidatePath('/petugas')` dan kembalikan baris rumah terbaru dari `v_saldo_warga`.
- `daftarRumah`: hanya `aktif=true`, urut blok lalu `no_rumah` **numerik**.
- `ambilSabtuBerikutnya`: `getUser()` lalu `rpc('sabtu_berikutnya')`, kembalikan string `YYYY-MM-DD`.
- `isiJadwalOtomatis`: pasangan berurutan memutar dari `akun_petugas` aktif (urut nama), melewati Sabtu yang sudah terisi, maksimal 12 minggu, kurang dari 2 petugas → `PETUGAS_KURANG`. Kolom `petugas_1/2` berisi `warga_id`, bukan `user_id`.
- `simpanWarga`: `no_rumah` tetap teks ("01"), `nama` di-trim dan huruf besar. Tidak ada aksi hapus.
- `ubahPengaturan`: hanya `iuran_per_minggu` dan `batas_langganan_nunggak`.

## Pemeriksaan wajib (laporkan lulus/gagal + alasan)

Dengan satu akun petugas (`{nama}@jimpitan.local`, PIN 6 digit):

1. `GET /api/publik/ringkasan` tanpa login: `total_rumah = 51`, tidak ada nama warga.
2. `/petugas` tanpa login → `/login`.
3. `masuk` PIN salah → `LOGIN_GAGAL`; PIN benar berhasil; akun nonaktif → `TIDAK_BERHAK`.
4. `daftarRumah()`: 51 rumah, urut C0/01, C0/04, C0/06, ...
5. `simpanSetoran` C0/01 Rp2.000 berhasil; `setoran_sabtu_ini` = 2000.
6. Simpan lagi Rp6.000 untuk rumah yang sama **menimpa** (tetap satu baris).
7. Jumlah 0 membatalkan; -1 → `JUMLAH_TIDAK_VALID`; 60000 tanpa konfirmasi → `JUMLAH_BESAR`, dengan konfirmasi berhasil.
8. Tanggal bukan Sabtu → `SABTU_SALAH` (untuk setoran **dan** jadwal).
9. `aturJadwal` dengan dua petugas sama → `PETUGAS_SAMA`.
10. `isiJadwalOtomatis` 4 minggu mengisi 4 Sabtu berurutan dan tidak menimpa yang sudah ada.
11. Setelah nomor 5, `ringkasan_publik` menunjukkan `terkumpul` dan `sudah_bayar` naik.
12. Tanpa login, `from('setoran').select()` tidak mengembalikan data.
13. Tanpa env, endpoint publik mengembalikan galat 500, **bukan data tiruan**.
14. `npm run lint` dan `npm run build` lulus.

## Jangan

- Jangan mengubah database atau `supabase/jimpitan-final.sql`.
- Jangan menghitung saldo di TypeScript, jangan membuat data cadangan atau tiruan.
- Jangan membuat endpoint REST tambahan (hanya satu route handler).
- Jangan membuat tampilan final (tahap 2).
