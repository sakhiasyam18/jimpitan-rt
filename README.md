# Jimpitan RT

Aplikasi web mobile untuk mencatat jimpitan mingguan RT 23 RW 6, Kelurahan Munggut, Jalan Munggut Peni (51 rumah, blok C0/C1/C2). Petugas yang jaga mencatat uang masuk lewat HP, warga melihat ringkasan live tanpa login.

**Stack:** Next.js (App Router, TypeScript), Tailwind, Supabase (Postgres + Auth), Vercel.

## Dokumentasi

| Berkas | Isi |
|---|---|
| `docs/kerangka-jimpitan-rt.md` | Konteks produk dan aturan iuran |
| `docs/spec-rilis-jimpitan-rt.md` | Spesifikasi teknis dan checklist rilis |
| `supabase/jimpitan-final.sql` | Skema, keamanan, fungsi, dan data 51 rumah |
| `AGENTS.md` | Aturan untuk AI agent |

## Menyiapkan database (Supabase)

1. Buat proyek di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, tempel seluruh isi `supabase/jimpitan-final.sql`, lalu **Run**. Aman diulang.
3. Pastikan hasil pemeriksaan di bagian bawah file: C0 = 29, C1 = 2, C2 = 20 (total 51).
4. Atur `tanggal_mulai` di tabel `pengaturan` ke Sabtu pertama pemakaian (harus hari Sabtu).
5. Matikan pendaftaran mandiri: **Authentication > Sign In / Providers > Email**, nonaktifkan "Allow new users to sign up".

### Membuat akun petugas

Untuk tiap petugas:

1. **Authentication > Users > Add user**. Email `nama.kecil@jimpitan.local` (mis. `pak.heru@jimpitan.local`), password berupa **PIN 6 digit**, centang *Auto Confirm User*.
2. Hubungkan ke data warga di SQL Editor (sesuaikan email dan rumah):

```sql
insert into public.akun_petugas (user_id, warga_id, nama)
select u.id, w.id, 'Pak Heru'
from auth.users u, public.warga w
where u.email = 'pak.heru@jimpitan.local'
  and w.blok = 'C2' and w.no_rumah = '07';
```

Di halaman login, petugas cukup mengetik nama (mis. `pak heru`) dan PIN.

## Menjalankan di komputer

Buat berkas `.env.local` di folder utama dan isi dua variabel di bawah, lalu:

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

Variabel lingkungan (`.env.local`, jangan di-commit):

| Variabel | Sumber |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Connect / API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > API Keys (kunci anon/publishable) |

Jangan pernah memakai service role key di aplikasi ini.

## Perintah

```bash
npm run dev     # pengembangan
npm run lint
npm run build   # harus lulus sebelum deploy
```

## Deploy ke Vercel

1. Impor repo GitHub di [vercel.com/new](https://vercel.com/new).
2. Isi dua variabel lingkungan di atas pada pengaturan proyek.
3. Deploy, lalu uji di HP: login, simpan satu setoran, pastikan beranda berubah dalam 30 detik.

## Catatan operasional

- **Supabase paket gratis mem-pause proyek** yang tidak aktif sekitar seminggu. Pasang pengecekan terjadwal ringan (mis. ping harian) bila khawatir libur panjang.
- Isi jadwal jaga beberapa Sabtu ke depan lewat halaman **Jadwal**, supaya beranda warga menampilkan nama petugas.
- Saldo dan tunggakan dihitung di database. Jangan mengubah isi tabel `setoran` langsung kecuali sengaja mengoreksi.
