-- Weekly schedule stored under reusable programs.
create table if not exists public.program_template_days (
  id uuid primary key default gen_random_uuid(),
  program_template_id uuid not null references public.program_templates(id) on delete cascade,
  week_number int not null check (week_number between 1 and 104),
  day_number int not null check (day_number between 1 and 7),
  created_at timestamptz not null default now(),
  unique(program_template_id,week_number,day_number)
);
create table if not exists public.program_template_day_workouts (
  id uuid primary key default gen_random_uuid(),
  program_template_day_id uuid not null references public.program_template_days(id) on delete cascade,
  workout_template_id uuid references public.workout_templates(id) on delete restrict,
  name text not null check(char_length(name) between 1 and 200),
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.program_template_days enable row level security;
alter table public.program_template_day_workouts enable row level security;
create policy program_template_days_coach_all on public.program_template_days for all to authenticated using(exists(select 1 from public.program_templates p where p.id=program_template_id and p.coach_id=(select auth.uid()))) with check(exists(select 1 from public.program_templates p where p.id=program_template_id and p.coach_id=(select auth.uid())));
create policy program_template_day_workouts_coach_all on public.program_template_day_workouts for all to authenticated using(exists(select 1 from public.program_template_days d join public.program_templates p on p.id=d.program_template_id where d.id=program_template_day_id and p.coach_id=(select auth.uid()))) with check(exists(select 1 from public.program_template_days d join public.program_templates p on p.id=d.program_template_id where d.id=program_template_day_id and p.coach_id=(select auth.uid())));
