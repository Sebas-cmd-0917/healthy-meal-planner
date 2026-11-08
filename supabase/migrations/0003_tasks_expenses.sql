-- Cumplimiento de la agenda, descanso entre series, tablero de tareas y gastos.
-- Ejecutar en Supabase > SQL Editor (después de 0002_schedule.sql).

-- Marcar actividades de la agenda como realizadas
alter table public.schedule_blocks
  add column if not exists done boolean not null default false;

-- Descanso entre series, en segundos
alter table public.workout_exercises
  add column if not exists rest_seconds integer check (rest_seconds is null or rest_seconds >= 0);

-- Tablero semanal: tareas por día
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  title       text not null check (char_length(title) between 1 and 120),
  notes       text not null default '',
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists tasks_date_idx on public.tasks (date);

-- Gastos en pesos colombianos (sin decimales)
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  amount      bigint not null check (amount > 0),
  category    text not null default 'otros' check (category in (
                'comida', 'mercado', 'transporte', 'hogar', 'servicios',
                'salud', 'entretenimiento', 'compras', 'otros')),
  note        text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists expenses_date_idx on public.expenses (date);

alter table public.tasks enable row level security;
alter table public.expenses enable row level security;
