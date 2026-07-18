-- Rich workout metadata and reusable program library.
alter table public.workout_templates
  add column if not exists description text,
  add column if not exists difficulty text,
  add column if not exists notes text;
alter table public.workout_template_exercises add column if not exists section_name text;

create table if not exists public.program_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  description text,
  difficulty text not null,
  duration_weeks int not null check (duration_weeks between 1 and 104),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, name)
);
alter table public.program_templates enable row level security;
create policy program_templates_coach_all on public.program_templates for all to authenticated
using (coach_id=(select auth.uid())) with check (coach_id=(select auth.uid()) and public.auth_role()='coach');
create policy program_templates_admin_all on public.program_templates for all to authenticated
using (public.auth_role()='admin') with check (public.auth_role()='admin');
create index if not exists program_templates_coach_name_idx on public.program_templates(coach_id,lower(name));
