-- Ejecutar en Supabase → SQL Editor (proyecto gratuito)
-- Habilita perfil remoto y RLS

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
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);
