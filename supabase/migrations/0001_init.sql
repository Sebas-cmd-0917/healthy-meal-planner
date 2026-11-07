-- Ejecutar en Supabase > SQL Editor
create extension if not exists "pgcrypto";

create table if not exists public.recipes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  calories    integer check (calories is null or calories >= 0),
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- El backend usa la secret key (sb_secret_...), así que se activa RLS sin políticas públicas:
-- nadie puede leer/escribir directo desde el navegador con la anon key.
alter table public.recipes enable row level security;
