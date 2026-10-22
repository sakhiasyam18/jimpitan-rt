-- ==============================================================================
-- JIMPITAN RT 23 / RW 06 — SKEMA DATABASE SUPABASE
-- Kelurahan Munggut, Jalan Munggut Peni
-- ==============================================================================

-- 1. TABEL WARGA (51 Rumah)
create table if not exists public.warga (
  id uuid primary key default gen_random_uuid(),
  blok text not null,
  no_rumah text not null,
  nama text not null,
  aktif boolean not null default true,
  constraint warga_blok_no_rumah_unique unique (blok, no_rumah)
);

create index if not exists idx_warga_blok_no on public.warga(blok, no_rumah);

-- 2. TABEL AKUN PETUGAS (Menghubungkan Auth Supabase ke Warga)
create table if not exists public.akun_petugas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  warga_id uuid references public.warga(id) on delete set null,
  nama text not null,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. TABEL JADWAL JAGA (2 Petugas per Sabtu)
create table if not exists public.jadwal (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null unique,
  petugas_1 uuid references public.warga(id) on delete set null,
  petugas_2 uuid references public.warga(id) on delete set null,
  catatan text
);

create index if not exists idx_jadwal_tanggal on public.jadwal(tanggal desc);

-- 4. TABEL SETORAN (Satu baris per rumah per Sabtu)
create table if not exists public.setoran (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  warga_id uuid not null references public.warga(id) on delete cascade,
  jumlah integer not null default 0 check (jumlah >= 0),
  dicatat_oleh uuid references auth.users(id) on delete set null,
  dicatat_pada timestamptz not null default now(),
  constraint setoran_tanggal_warga_unique unique (tanggal, warga_id)
);

create index if not exists idx_setoran_tanggal on public.setoran(tanggal desc);
create index if not exists idx_setoran_warga on public.setoran(warga_id);

-- 5. TABEL PENGATURAN (Konfigurasi Global 1 Baris)
create table if not exists public.pengaturan (
  id integer primary key default 1 check (id = 1),
  iuran_per_minggu integer not null default 2000,
  tanggal_mulai date not null default current_date,
  batas_langganan_nunggak integer not null default 3,
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- FUNGSI BANTUAN
-- ==============================================================================

-- Fungsi memeriksa apakah user yang login adalah petugas aktif
create or replace function public.is_petugas_aktif()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.akun_petugas
    where user_id = auth.uid()
      and aktif = true
  );
$$;

-- Fungsi menghitung jumlah Sabtu antara dua tanggal (inklusif)
create or replace function public.hitung_jumlah_sabtu(p_mulai date, p_sampai date)
returns integer
language plpgsql
immutable
as $$
declare
  v_count integer;
begin
  if p_sampai < p_mulai then
    return 0;
  end if;

  select count(*)::integer into v_count
  from generate_series(p_mulai::timestamp, p_sampai::timestamp, interval '1 day') as d
  where extract(isodow from d) = 6;

  return coalesce(v_count, 0);
end;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

alter table public.warga enable row level security;
alter table public.akun_petugas enable row level security;
alter table public.jadwal enable row level security;
alter table public.setoran enable row level security;
alter table public.pengaturan enable row level security;

-- Policy Warga: Petugas aktif dapat melihat, menambah, mengubah
drop policy if exists "Petugas aktif dapat mengelola warga" on public.warga;
create policy "Petugas aktif dapat mengelola warga"
  on public.warga
  for all
  to authenticated
  using (public.is_petugas_aktif())
  with check (public.is_petugas_aktif());

-- Policy Akun Petugas:
-- User dapat melihat profilnya sendiri
drop policy if exists "User dapat melihat profil petugasnya" on public.akun_petugas;
create policy "User dapat melihat profil petugasnya"
  on public.akun_petugas
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_petugas_aktif());

-- Petugas aktif dapat mengelola akun petugas lain
drop policy if exists "Petugas aktif mengelola akun petugas" on public.akun_petugas;
create policy "Petugas aktif mengelola akun petugas"
  on public.akun_petugas
  for all
  to authenticated
  using (public.is_petugas_aktif())
  with check (public.is_petugas_aktif());

-- Policy Jadwal: Petugas aktif dapat melihat dan mengelola
drop policy if exists "Petugas aktif dapat mengelola jadwal" on public.jadwal;
create policy "Petugas aktif dapat mengelola jadwal"
  on public.jadwal
  for all
  to authenticated
  using (public.is_petugas_aktif())
  with check (public.is_petugas_aktif());

-- Policy Setoran: Petugas aktif dapat membaca & menginput/mengubah setoran
drop policy if exists "Petugas aktif dapat mengelola setoran" on public.setoran;
create policy "Petugas aktif dapat mengelola setoran"
  on public.setoran
  for all
  to authenticated
  using (public.is_petugas_aktif())
  with check (public.is_petugas_aktif());

-- Policy Pengaturan: Petugas aktif dapat membaca & mengubah pengaturan
drop policy if exists "Petugas aktif dapat mengelola pengaturan" on public.pengaturan;
create policy "Petugas aktif dapat mengelola pengaturan"
  on public.pengaturan
  for all
  to authenticated
  using (public.is_petugas_aktif())
  with check (public.is_petugas_aktif());

-- ==============================================================================
-- FUNGSI RINGKASAN PUBLIK (SECURITY DEFINER - DIBACA WARGA TANPA LOGIN)
-- ==============================================================================

create or replace function public.ringkasan_publik(p_tanggal date default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_target_date date;
  v_iuran integer;
  v_tgl_mulai date;
  v_jumlah_sabtu integer;
  v_total_terkumpul integer := 0;
  v_sudah_bayar_count integer := 0;
  v_total_rumah integer := 0;
  v_petugas_1 text := '-';
  v_petugas_2 text := '-';
  v_catatan_jadwal text := null;
  v_blok_ringkasan jsonb;
begin
  -- 1. Ambil pengaturan sistem
  select iuran_per_minggu, tanggal_mulai
  into v_iuran, v_tgl_mulai
  from public.pengaturan
  where id = 1;

  if v_iuran is null then
    v_iuran := 2000;
  end if;

  if v_tgl_mulai is null then
    v_tgl_mulai := current_date;
  end if;

  -- 2. Tentukan tanggal Sabtu yang bersangkutan
  if p_tanggal is not null then
    v_target_date := p_tanggal;
  else
    v_target_date := case
      when extract(isodow from current_date) = 6 then current_date
      when extract(isodow from current_date) = 7 then (current_date - 1)::date
      else coalesce(
        (select max(tanggal) from public.setoran where jumlah > 0 and tanggal >= current_date - 6),
        (select tanggal from public.jadwal where tanggal = (current_date + (6 - extract(isodow from current_date)::int))::date),
        (current_date + (6 - extract(isodow from current_date)::int))::date
      )
    end;
  end if;

  -- 3. Hitung jumlah sabtu dari tanggal_mulai hingga v_target_date
  v_jumlah_sabtu := public.hitung_jumlah_sabtu(v_tgl_mulai, v_target_date);

  -- 4. Ambil informasi petugas pada jadwal
  select 
    coalesce(w1.nama, 'Belum diatur'),
    coalesce(w2.nama, 'Belum diatur'),
    j.catatan
  into v_petugas_1, v_petugas_2, v_catatan_jadwal
  from public.jadwal j
  left join public.warga w1 on j.petugas_1 = w1.id
  left join public.warga w2 on j.petugas_2 = w2.id
  where j.tanggal = v_target_date;

  -- 5. Hitung ringkasan total terkumpul & sudah bayar minggu ini
  select 
    coalesce(sum(s.jumlah), 0),
    count(distinct case when s.jumlah > 0 then s.warga_id end)
  into v_total_terkumpul, v_sudah_bayar_count
  from public.setoran s
  join public.warga w on s.warga_id = w.id and w.aktif = true
  where s.tanggal = v_target_date;

  select count(*) into v_total_rumah from public.warga where aktif = true;

  -- 6. Hitung ringkasan per blok
  with rumah_saldo as (
    select
      w.id as warga_id,
      w.blok,
      coalesce(sabtu_ini.jumlah, 0) as jumlah_sabtu_ini,
      (
        coalesce((select sum(jumlah) from public.setoran where warga_id = w.id), 0)
        - (v_iuran * v_jumlah_sabtu)
      ) as saldo
    from public.warga w
    left join public.setoran sabtu_ini on sabtu_ini.warga_id = w.id and sabtu_ini.tanggal = v_target_date
    where w.aktif = true
  ),
  per_blok as (
    select
      blok,
      count(*) as total_rumah,
      count(*) filter (where jumlah_sabtu_ini > 0) as sudah_bayar,
      count(*) filter (where saldo < 0) as nunggak
    from rumah_saldo
    group by blok
    order by blok
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'blok', blok,
        'total_rumah', total_rumah,
        'sudah_bayar', sudah_bayar,
        'nunggak', nunggak
      )
    ),
    '[]'::jsonb
  )
  into v_blok_ringkasan
  from per_blok;

  -- 7. Bentuk JSON output lengkap
  return jsonb_build_object(
    'tanggal', v_target_date,
    'petugas_1', coalesce(v_petugas_1, 'Belum diatur'),
    'petugas_2', coalesce(v_petugas_2, 'Belum diatur'),
    'catatan_jadwal', v_catatan_jadwal,
    'total_terkumpul', v_total_terkumpul,
    'sudah_bayar_count', v_sudah_bayar_count,
    'total_rumah', v_total_rumah,
    'iuran_per_minggu', v_iuran,
    'jumlah_sabtu', v_jumlah_sabtu,
    'blok_ringkasan', v_blok_ringkasan
  );
end;
$$;

-- Izin jalankan fungsi ringkasan_publik untuk publik (anon) dan authenticated
grant execute on function public.ringkasan_publik(date) to anon, authenticated;

-- ==============================================================================
-- DATA AWAL (SEED DATA)
-- ==============================================================================

-- Pengaturan default
insert into public.pengaturan (id, iuran_per_minggu, tanggal_mulai, batas_langganan_nunggak)
values (1, 2000, current_date, 3)
on conflict (id) do nothing;

-- 51 Data Rumah Warga RT 23 RW 06
insert into public.warga (blok, no_rumah, nama) values
('C0','01','AGUNG'),
('C0','04','GHON'),
('C0','06','LULUK'),
('C0','07','HELMI'),
('C0','08','AGUS'),
('C0','11','MAHFUD'),
('C0','14','BIANTO'),
('C0','16','CUCUK'),
('C0','17','WIDI'),
('C0','09','BU YULI'),
('C0','18','ANDIK'),
('C0','20','BU SRI'),
('C0','19','ROBI'),
('C0','21','SUGENG'),
('C0','22','ARIF FANDI'),
('C0','23','MARSUDI'),
('C0','24','ANGGIT'),
('C0','25','EKO YULI'),
('C0','26','REDO'),
('C0','27','UJIONO'),
('C0','33','MASRURI'),
('C0','34','HENDRO'),
('C0','36','WIWIN'),
('C0','37','DEDI'),
('C0','35','NU MARIJAN'),
('C0','30','BU RENI'),
('C0','38','ARIF N'),
('C0','39','SUTARTO'),
('C0','41','LASIMIN'),
('C1','02','HENDRA K'),
('C1','06','TRI ANANTO'),
('C2','01','HENDRA W'),
('C2','02','ANWAR'),
('C2','06','HUTAPEA'),
('C2','07','HERU SURYA'),
('C2','08','SUPARTO'),
('C2','09','PUTHUT'),
('C2','10','SUMADI'),
('C2','05','BU MUHTAROM'),
('C2','12','SUWONDO'),
('C2','14','ABDUL QODIR'),
('C2','15','IMAN'),
('C2','16','BU TOM'),
('C2','17','DAVIT'),
('C2','18','SUPARMAN'),
('C2','19','BU SOFNI'),
('C2','20','BU HERU'),
('C2','22','EKO HARI'),
('C2','23','SUKADI'),
('C2','04','BU IRA'),
('C2','11','BU BERNADUS')
on conflict (blok, no_rumah) do nothing;
