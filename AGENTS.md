<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Jimpitan RT: aturan untuk AI agent

Sumber kebenaran: `docs/spec-rilis-jimpitan-rt.md`. Konteks produk: `docs/kerangka-jimpitan-rt.md`. Bila ada konflik, spesifikasi yang berlaku. Baca keduanya sebelum mengubah kode.

### Aturan keras

1. **Database final.** Jangan mengedit `supabase/jimpitan-final.sql`, jangan menulis SQL atau migrasi baru. Bila menemukan masalah di DB, laporkan.
2. **Saldo dan tunggakan hanya dihitung di DB** (`v_saldo_warga`, `ringkasan_publik()`). Jangan menghitung ulang di TypeScript.
3. **Hanya kunci anon** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Jangan memakai atau meminta service role key. Jangan commit `.env*`.
4. **Otorisasi dengan `supabase.auth.getUser()`**, bukan `getSession()`. Semua aksi selain `masuk` memeriksa login.
5. **Jangan pernah menampilkan data cadangan atau tiruan.** Bila data gagal dimuat, tampilkan "Data belum bisa dimuat" tanpa angka.
6. **Tanggal memakai zona Asia/Jakarta**, bukan jam perangkat. Tanggal setoran dan jadwal harus Sabtu.
7. **Publik tidak boleh menerima nama warga atau nominal per rumah.**
8. **Aksi mengembalikan `Hasil<T>`**, bukan melempar galat ke tampilan. Pesan galat Indonesia, pendek.

### Gaya

- TypeScript ketat, tanpa `any`. Tanpa ORM, state manager, UI library, atau library ikon dan animasi.
- Tailwind saja. Mobile-first 360px, tema terang, zoom diizinkan.
- Huruf utama ≥18px, tidak ada teks <13px, target ketuk ≥56px. Warna selalu disertai teks.
- Jangan memakai `localStorage` atau `sessionStorage`.
- Jangan menambah fitur, halaman, atau dependensi di luar yang diminta. Bila perlu dependensi baru, sebutkan alasannya dulu.

### Perintah

```bash
npm run dev      # pengembangan
npm run lint
npm run build    # wajib lulus sebelum melapor selesai
```

### Cara melapor

Sebutkan berkas yang diubah, jalankan `npm run lint` dan `npm run build`, dan laporkan hasil tiap pemeriksaan yang diminta (lulus atau gagal beserta alasannya). Jangan menyebut sesuatu selesai bila belum dijalankan.
