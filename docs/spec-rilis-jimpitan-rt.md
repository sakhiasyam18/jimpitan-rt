# Jimpitan RT: Spesifikasi Teknis (Rilis)

Sumber kebenaran untuk AI agent dan developer. Bila ada konflik dengan dokumen lain, berkas ini yang berlaku.

| Dokumen | Fungsi |
|---|---|
| `docs/kerangka-jimpitan-rt.md` | Konteks produk dan aturan bisnis |
| `docs/spec-rilis-jimpitan-rt.md` | Spesifikasi teknis (berkas ini) |
| `supabase/jimpitan-final.sql` | Skema, RLS, view, fungsi, data awal. **Tidak diedit oleh agent** |
| `AGENTS.md` | Aturan tetap untuk AI agent |

## 1. Ringkasan

Web app mobile-first untuk iuran mingguan RT 23 RW 6 (51 rumah, blok C0/C1/C2). Iuran Rp2.000 per rumah per Sabtu (WIB). Kelebihan menjadi saldo, kekurangan menjadi tunggakan. Publik hanya melihat ringkasan. Petugas login untuk mencatat.

## 2. Stack dan konfigurasi

Next.js (App Router, TypeScript), Tailwind, `@supabase/supabase-js`, `@supabase/ssr`. Hosting Vercel. DB dan Auth Supabase. Tanpa ORM, state manager, atau UI library.

- Versi Next.js di proyek ini baru: baca `node_modules/next/dist/docs/` sebelum menulis kode. Guard sesi memakai `proxy.ts` (Next 16), bukan `middleware.ts`.
- Env (client-safe saja): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Service role key **dilarang** di aplikasi.
- Bila build gagal karena Tailwind/Turbopack, pakai integrasi resmi Tailwind v4 (`@tailwindcss/postcss` + `postcss.config.mjs`).

## 3. Model data

| Objek | Keterangan |
|---|---|
| `warga` | id, blok (C0/C1/C2), no_rumah (text), nama, aktif. Unik (blok, no_rumah) |
| `akun_petugas` | user_id (auth.users), warga_id, nama, aktif |
| `jadwal` | tanggal (unik, Sabtu), petugas_1, petugas_2 (keduanya warga_id, harus beda), catatan |
| `setoran` | tanggal (Sabtu), warga_id, jumlah >= 0, dicatat_oleh, dicatat_pada. Unik (tanggal, warga_id) |
| `pengaturan` | satu baris: iuran_per_minggu, tanggal_mulai (Sabtu), batas_langganan_nunggak |
| `v_saldo_warga` | view `security_invoker`, hanya petugas. Satu baris per rumah |
| `ringkasan_publik()` | RPC jsonb tanpa argumen, boleh anon |
| `sabtu_terbaru()`, `sabtu_berikutnya()` | fungsi tanggal WIB (untuk rekap/input dan untuk jadwal) |

`v_saldo_warga`: `warga_id, blok, no_rumah, nama, aktif, label, sabtu_terbaru, setoran_sabtu_ini, sudah_dicatat_sabtu_ini, dibayar, kewajiban, saldo, minggu_nunggak, langganan_nunggak`.

`ringkasan_publik()`:
```json
{ "sabtu_rekap": "YYYY-MM-DD", "sabtu_jaga": "YYYY-MM-DD", "petugas": ["..."],
  "terkumpul": 0, "sudah_bayar": 0, "total_rumah": 0,
  "blok": [{ "blok": "C0", "total": 0, "sudah": 0, "nunggak": 0 }] }
```
`sudah` = saldo >= 0. `nunggak` = kurang >= 2 minggu. `sabtu_rekap` = Sabtu terbaru yang sudah tiba. `sabtu_jaga` = Sabtu berikutnya (hari ini bila Sabtu).

## 4. Invarian (wajib)

1. Saldo, tunggakan, dan jumlah minggu **hanya dihitung di DB**. Aplikasi tidak menghitung ulang.
2. `dicatat_oleh` dan `dicatat_pada` diisi trigger. Aplikasi tidak mengirimnya.
3. Koreksi setoran = upsert `(tanggal, warga_id)`. Batal = `jumlah: 0`. Tidak ada hapus.
4. Rumah tidak dihapus, hanya `aktif=false`. Setoran baru ke rumah nonaktif ditolak trigger.
5. Tanggal setoran dan jadwal harus Sabtu. Perhitungan tanggal memakai Asia/Jakarta, bukan jam perangkat.
6. Publik tidak pernah menerima nama warga atau nominal per rumah.
7. Kegagalan data tidak boleh menghasilkan angka cadangan atau tiruan di UI.

## 5. API

**Route publik.** `GET /api/publik/ringkasan` memanggil `rpc('ringkasan_publik')`. Header `Cache-Control: public, max-age=0, s-maxage=15, stale-while-revalidate=30`. Galat: 500 dengan `{ error: { kode, pesan } }`. Ini satu-satunya route handler.

**Server Actions** (`src/actions/*`) mengembalikan `Hasil<T> = { ok: true, data } | { ok: false, error: { kode, pesan } }`. Semua kecuali `masuk` memanggil `getUser()` dan menolak `BELUM_MASUK`.

| Aksi | Catatan |
|---|---|
| `masuk(nama, pin)` | Email `{nama huruf kecil, spasi jadi titik}@jimpitan.local` (konstanta `EMAIL_DOMAIN`), PIN 6 digit. Akun nonaktif ditolak `TIDAK_BERHAK`. Galat login selalu "Nama atau PIN salah." |
| `keluar()` | |
| `daftarRumah(blok?)` | Baca `v_saldo_warga`, aktif, urut blok lalu no_rumah (numerik) |
| `simpanSetoran({warga_id, jumlah, tanggal?, konfirmasiBesar?})` | Tanggal default `sabtu_terbaru`. `jumlah > 50000` tanpa konfirmasi → `JUMLAH_BESAR`. Upsert, lalu `revalidatePath('/petugas')`, kembalikan baris terbaru |
| `lihatJadwal(dari, sampai)`, `aturJadwal`, `isiJadwalOtomatis`, `daftarPetugasAktif`, `ambilSabtuBerikutnya` | petugas_1 ≠ petugas_2. Auto-fill melewati Sabtu terisi, maksimal 12 minggu, butuh ≥2 petugas aktif. `ambilSabtuBerikutnya` memanggil `rpc('sabtu_berikutnya')` |
| `daftarWarga`, `simpanWarga`, `ubahStatusWarga` | Tanpa hapus. `no_rumah` teks, nama huruf besar |
| `lihatPengaturan`, `ubahPengaturan` | `tanggal_mulai` tidak bisa diubah dari app |

**Kode galat:** `BELUM_MASUK, TIDAK_BERHAK, LOGIN_GAGAL, SABTU_SALAH, JUMLAH_TIDAK_VALID, JUMLAH_BESAR, RUMAH_TIDAK_AKTIF, RUMAH_KEMBAR, PETUGAS_SAMA, PETUGAS_KURANG, GALAT_UMUM`. Pesan Indonesia, pendek. Detail teknis hanya ke `console.error`.

Pemetaan Postgres (cocokkan tak peka huruf besar-kecil):

| Sumber | Kode |
|---|---|
| `42501` | `TIDAK_BERHAK` |
| `23505` pada `warga_blok_no_unik` | `RUMAH_KEMBAR` |
| `23514` memuat `petugas_beda` | `PETUGAS_SAMA` |
| `23514` memuat `tanggal_check`, `sabtu`, atau `isodow` | `SABTU_SALAH` |
| `23514` memuat `jumlah_check` | `JUMLAH_TIDAK_VALID` |
| pesan berawalan `RUMAH_TIDAK_AKTIF` | `RUMAH_TIDAK_AKTIF` |
| lainnya | `GALAT_UMUM` |

## 6. Keamanan

- RLS aktif di semua tabel. Petugas aktif (`is_petugas()`) boleh baca dan tulis. Anon tidak punya akses tabel atau view, hanya `ringkasan_publik()`.
- Otorisasi memakai `supabase.auth.getUser()`, bukan `getSession()`.
- `/petugas/*` dijaga di `proxy.ts` dan di tiap aksi.
- `.env*` tidak boleh di-commit.

## 7. Rute dan berkas

```
src/
  proxy.ts
  app/  page.tsx  login/  petugas/{page,jadwal,warga}  api/publik/ringkasan/route.ts
  actions/  auth  setoran  jadwal  warga  pengaturan
  components/  (UI bersama, BerandaLive client)
  lib/  supabase/{server,browser}  konstanta  validasi  galat  format
  types/
```

`/` beranda warga (polling 30 detik, jeda saat tab tersembunyi) · `/login` · `/petugas` daftar rumah + lembar terima setoran · `/petugas/jadwal` · `/petugas/warga`.

## 8. Batasan UI

Mobile 360px, tema terang saja (`color-scheme: light`), zoom diizinkan. Huruf utama ≥18px, tidak ada teks <13px, target ketuk ≥56px. Warna: hijau aman, kuning belum (1 minggu), merah nunggak (≥2 minggu), selalu disertai teks. `Rp2.000`, tanggal `24 Okt 2026`. Keadaan memuat, kosong, dan galat wajib ada. Bila data publik gagal dimuat: "Data belum bisa dimuat" tanpa angka.

## 9. Checklist rilis

**Supabase**
- [ ] `jimpitan-final.sql` dijalankan penuh. Cek: C0=29, C1=2, C2=20, `total_rumah=51`, RLS aktif di 5 tabel.
- [ ] Fungsi lama (`ringkasan_publik(date)`, `is_petugas_aktif()`, `hitung_jumlah_sabtu(date,date)`) sudah dihapus otomatis oleh bagian 0 SQL. Cek tidak ada fungsi ganda: `select proname, pg_get_function_identity_arguments(oid) from pg_proc where pronamespace='public'::regnamespace and proname like 'ringkasan%';` harus satu baris dengan argumen kosong.
- [ ] Akun petugas dibuat (Auth) dan terhubung ke `akun_petugas`.
- [ ] Sign-ups mandiri dimatikan.
- [ ] `pengaturan.tanggal_mulai` diset ke Sabtu pertama pemakaian.
- [ ] Jadwal beberapa Sabtu pertama terisi.
- [ ] Keep-alive terjadwal (free tier pause setelah ±7 hari tanpa aktivitas).

**Aplikasi**
- [ ] `npm run lint` dan `npm run build` lulus.
- [ ] Tanpa env, beranda menampilkan "Data belum bisa dimuat" tanpa angka.
- [ ] `/petugas` tanpa login → `/login`.
- [ ] Alur: login → simpan setoran → beranda berubah ≤30 detik.

**Vercel**
- [ ] Repo terhubung, dua env diisi, deploy produksi, uji di HP asli.

## 10. Keputusan terbuka (default berlaku)

Nama warga nunggak di publik: tidak tampil. Batas langganan nunggak: 3 minggu. C0/C1/C2 = P0/P1/P2: tidak berpengaruh pada logika. Nominal cepat: 2.000/4.000/6.000/Lainnya. Ejaan "NU MARIJAN": apa adanya.
