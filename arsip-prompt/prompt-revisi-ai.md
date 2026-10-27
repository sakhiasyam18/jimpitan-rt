# Prompt Revisi untuk AI Agent

Baca `AGENTS.md`, `docs/spec-rilis-jimpitan-rt.md`, dan `docs/api-design.md` (spek berlaku bila ada konflik; kontrak aksi mengikuti api-design). Kerjakan **hanya** perbaikan di bawah, berurutan. Jangan menambah fitur, dependensi, atau mengubah DB. `supabase/jimpitan-final.sql` tidak boleh diedit.

## Perbaikan

1. **Hapus data cadangan beranda.** `src/lib/data.ts`: hapus `getFallbackRingkasan`, semua pemetaan bentuk lama (`blok_ringkasan`, `petugas_1/2`, `total_terkumpul`, `as any`). `fetchRingkasanPublik()` mengembalikan `RingkasanPublikResponse | null` (null bila env kosong, RPC galat, atau bentuk tidak valid). `BerandaLive`: bila `null` dan belum ada data, tampilkan kotak "Data belum bisa dimuat. Coba lagi sebentar." + tombol "Coba lagi", **tanpa angka**. Polling tetap jalan.
2. **Hapus hitungan saldo di app.** Hapus `src/lib/saldo.ts` dan tipe yang hanya dipakainya. Pindahkan `formatRupiah`/`formatTanggal` ke `src/lib/format.ts` (WIB), perbarui impor.
3. **Bersihkan sisa.** Hapus `src/lib/mock-data.ts`, `src/components/TerimaSetoranModal.tsx`, `src/utils/supabase/*`, `src/lib/supabase/middleware.ts`, `src/lib/supabase/client.ts` (ganti impornya ke `@/lib/supabase/browser`). Pertahankan `proxy.ts`, `server.ts`, `browser.ts`.
4. **Skema.** `supabase/schema.sql` lama sudah dihapus dan `supabase/jimpitan-final.sql` sudah ada. Cukup pastikan tidak ada rujukan ke `schema.sql` di kode atau dokumen. `README.md` dan `AGENTS.md` sudah diperbarui oleh pemilik proyek, jangan diubah.
5. **Viewport.** `layout.tsx`: hapus `maximumScale` dan `userScalable: false`.
6. **Galat.** `galat.ts`: untuk `23514` cocokkan (tak peka huruf): `petugas_beda`→`PETUGAS_SAMA`, `tanggal_check|sabtu|isodow`→`SABTU_SALAH`, `jumlah_check|jumlah`→`JUMLAH_TIDAK_VALID`.
7. **Jadwal.** Tambah aksi `ambilSabtuBerikutnya(): Promise<Hasil<string>>` di `actions/jadwal.ts` (`getUser()` + `rpc('sabtu_berikutnya')`). Halaman jadwal membentuk 8 Sabtu dari tanggal itu (+7 hari, hitung UTC). Jangan memakai jam perangkat. Gagal → `KotakGalat` + "Coba lagi".
8. **Build config.** Jalankan `npm run build`. Bila lulus dan gaya benar, jangan ubah konfigurasi. Bila gagal karena Tailwind/Turbopack: pakai `@tailwindcss/postcss` + `postcss.config.mjs`, hapus `turbopack.rules` CSS dan paket `@tailwindcss/turbopack`. Validasi `cacheComponents` dan `partialPrefetching` terhadap dokumen Next di `node_modules/next/dist/docs/`; hapus bila tidak valid.
9. **UI.** Naikkan ke `min-h-[56px]`: tombol di `LembarPenuh.tsx` (44), `KotakGalat.tsx` (44), `LayarTerimaSetoran.tsx` (48). `grep "text-xs\|text-\[1[0-2]px\]"` lalu naikkan ke ≥14px.
10. **Mode gelap.** `globals.css`: hapus `@media (prefers-color-scheme: dark)`, tambah `color-scheme: light` di `:root`, ganti font body ke `var(--font-geist-sans), Arial, sans-serif`. Latar/teks body tetap dari kelas di `layout.tsx`.

## Pemeriksaan (laporkan lulus/gagal + alasan)

1. `grep -rn "getFallbackRingkasan\|mock-data\|lib/saldo\|utils/supabase\|TerimaSetoranModal\|as any" src` kosong.
2. Tanpa `.env.local`, `/` menampilkan "Data belum bisa dimuat" tanpa angka. Dengan env benar, data DB tampil.
3. `/petugas` tanpa login → `/login`.
4. Jadwal: baris pertama = hasil `rpc('sabtu_berikutnya')`, juga pada hari Minggu.
5. Tanggal bukan Sabtu ke `aturJadwal` → "Tanggal harus hari Sabtu."
6. Lebar 360px: tombol ≥56px, teks ≥13px. Zoom diizinkan. Mode gelap emulasi tetap terang dan terbaca.
7. `npm run lint` dan `npm run build` lulus (sertakan peringatan bila ada).

Jangan membuat data tiruan, jangan commit `.env.local`.
