-- Reusable coach exercise library.
create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  category text not null check (char_length(category) between 1 and 100),
  target_muscle_groups text[] not null default '{}',
  movement_patterns text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, name)
);
alter table public.exercise_library enable row level security;
create policy exercise_library_coach_all on public.exercise_library for all to authenticated
using (coach_id = (select auth.uid()))
with check (coach_id = (select auth.uid()) and public.auth_role() = 'coach');
create policy exercise_library_admin_all on public.exercise_library for all to authenticated
using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
create index if not exists exercise_library_coach_name_idx on public.exercise_library(coach_id, lower(name));
