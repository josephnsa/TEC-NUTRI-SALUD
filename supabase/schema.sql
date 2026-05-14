-- TEC Nutri Salud · profiles + RLS + family_json (idempotente)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  age int,
  weight_kg numeric,
  height_cm numeric,
  sex text check (sex is null or sex in ('m', 'f', 'o')),
  conditions text,
  disliked_foods text,
  diet_style text default 'keto',
  updated_at timestamptz default now(),
  family_json jsonb
);

alter table public.profiles add column if not exists updated_at timestamptz default now();
alter table public.profiles add column if not exists family_json jsonb;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── Storage: evidencias de cronograma (plan gratuito Supabase; cuota según proyecto) ───
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tec-nutri-media',
  'tec-nutri-media',
  false,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tec_nutri_media_insert" on storage.objects;
drop policy if exists "tec_nutri_media_select" on storage.objects;
drop policy if exists "tec_nutri_media_update" on storage.objects;
drop policy if exists "tec_nutri_media_delete" on storage.objects;

-- Solo el usuario autenticado puede leer/escribir bajo la carpeta cuyo primer segmento es su `auth.uid()`.
create policy "tec_nutri_media_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tec-nutri-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "tec_nutri_media_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tec-nutri-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "tec_nutri_media_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'tec-nutri-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "tec_nutri_media_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tec-nutri-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Snapshots remotos (F3.1): mercados y planes como JSON compacto ───
create table if not exists public.user_market_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  perfil_local_id text not null default '_',
  snapshot_local_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists user_market_snapshots_user_perfil_local
  on public.user_market_snapshots (user_id, perfil_local_id, snapshot_local_id);

create index if not exists user_market_snapshots_user_updated
  on public.user_market_snapshots (user_id, updated_at desc);

alter table public.user_market_snapshots enable row level security;

drop policy if exists "market_snapshots_select_own" on public.user_market_snapshots;
drop policy if exists "market_snapshots_insert_own" on public.user_market_snapshots;
drop policy if exists "market_snapshots_update_own" on public.user_market_snapshots;
drop policy if exists "market_snapshots_delete_own" on public.user_market_snapshots;

create policy "market_snapshots_select_own"
  on public.user_market_snapshots for select to authenticated
  using (auth.uid() = user_id);

create policy "market_snapshots_insert_own"
  on public.user_market_snapshots for insert to authenticated
  with check (auth.uid() = user_id);

create policy "market_snapshots_update_own"
  on public.user_market_snapshots for update to authenticated
  using (auth.uid() = user_id);

create policy "market_snapshots_delete_own"
  on public.user_market_snapshots for delete to authenticated
  using (auth.uid() = user_id);

create table if not exists public.user_plan_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  perfil_local_id text not null,
  snapshot_local_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists user_plan_snapshots_user_perfil_local
  on public.user_plan_snapshots (user_id, perfil_local_id, snapshot_local_id);

create index if not exists user_plan_snapshots_user_updated
  on public.user_plan_snapshots (user_id, updated_at desc);

alter table public.user_plan_snapshots enable row level security;

drop policy if exists "plan_snapshots_select_own" on public.user_plan_snapshots;
drop policy if exists "plan_snapshots_insert_own" on public.user_plan_snapshots;
drop policy if exists "plan_snapshots_update_own" on public.user_plan_snapshots;
drop policy if exists "plan_snapshots_delete_own" on public.user_plan_snapshots;

create policy "plan_snapshots_select_own"
  on public.user_plan_snapshots for select to authenticated
  using (auth.uid() = user_id);

create policy "plan_snapshots_insert_own"
  on public.user_plan_snapshots for insert to authenticated
  with check (auth.uid() = user_id);

create policy "plan_snapshots_update_own"
  on public.user_plan_snapshots for update to authenticated
  using (auth.uid() = user_id);

create policy "plan_snapshots_delete_own"
  on public.user_plan_snapshots for delete to authenticated
  using (auth.uid() = user_id);