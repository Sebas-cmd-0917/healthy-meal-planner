-- Agenda semanal: bloques de trabajo, gym, comida u otras actividades.
-- Ejecutar en Supabase > SQL Editor (después de 0001_init.sql).

create table if not exists public.schedule_blocks (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  kind        text not null check (kind in ('trabajo', 'gym', 'comida', 'otro')),
  title       text not null,
  notes       text not null default '',
  recipe_id   uuid references public.recipes (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint schedule_blocks_time_order check (end_time > start_time),
  constraint schedule_blocks_recipe_only_meals check (recipe_id is null or kind = 'comida')
);

create index if not exists schedule_blocks_date_idx on public.schedule_blocks (date, start_time);

-- Rutina de cada bloque de gym
create table if not exists public.workout_exercises (
  id          uuid primary key default gen_random_uuid(),
  block_id    uuid not null references public.schedule_blocks (id) on delete cascade,
  position    integer not null default 0,
  name        text not null,
  sets        integer check (sets is null or sets > 0),
  reps        text,
  weight_kg   numeric(6, 2) check (weight_kg is null or weight_kg >= 0),
  notes       text not null default ''
);

create index if not exists workout_exercises_block_idx on public.workout_exercises (block_id, position);

-- Igual que recipes: solo el backend (secret key) accede.
alter table public.schedule_blocks enable row level security;
alter table public.workout_exercises enable row level security;
