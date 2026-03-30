create extension if not exists pgcrypto;

create table if not exists public.history_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  food_name text not null,
  mode text null check (mode in ('walk', 'brisk', 'run')),
  target_burn_kcal integer null,
  burn_ratio_percent integer null,
  duration_min integer null,
  weight_kg numeric(5, 2) not null,
  pace_min_per_km numeric(5, 2) not null,
  start_lat double precision not null,
  start_lng double precision not null,
  route_names_text text not null default '',
  analysis jsonb not null,
  routes jsonb not null
);

create index if not exists idx_history_entries_created_at_desc
  on public.history_entries (created_at desc);

create index if not exists idx_history_entries_mode
  on public.history_entries (mode);

create index if not exists idx_history_entries_food_name
  on public.history_entries using gin (to_tsvector('simple', coalesce(food_name, '')));

create index if not exists idx_history_entries_route_names_text
  on public.history_entries using gin (to_tsvector('simple', coalesce(route_names_text, '')));
