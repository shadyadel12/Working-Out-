-- Food library per coach: names of food types used in diet plans.
create table public.coach_foods (
  id         uuid        primary key default gen_random_uuid(),
  coach_id   uuid        not null references public.profiles(id) on delete cascade,
  name       text        not null check (char_length(name) > 0),
  created_at timestamptz not null default now(),
  unique (coach_id, name)
);

create index on public.coach_foods (coach_id, name);

alter table public.coach_foods enable row level security;

create policy cf_coach_all on public.coach_foods
  for all to authenticated
  using (public.auth_role() = 'coach' and coach_id = (select auth.uid()))
  with check (public.auth_role() = 'coach' and coach_id = (select auth.uid()));

create policy cf_admin_all on public.coach_foods
  for all to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');
