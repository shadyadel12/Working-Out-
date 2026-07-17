-- Food library per coach: names of food types used in diet plans.
create table if not exists public.coach_foods (
  id         uuid        primary key default gen_random_uuid(),
  coach_id   uuid        not null references public.profiles(id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now(),
  constraint coach_foods_name_not_empty check (char_length(name) > 0),
  constraint coach_foods_coach_name_unique unique (coach_id, name)
);

create index if not exists coach_foods_coach_name_idx
  on public.coach_foods (coach_id, name);

alter table public.coach_foods enable row level security;

drop policy if exists cf_coach_all on public.coach_foods;
create policy cf_coach_all on public.coach_foods
  for all to authenticated
  using (
    public.auth_role() = 'coach'
    and coach_id = (select auth.uid())
  )
  with check (
    public.auth_role() = 'coach'
    and coach_id = (select auth.uid())
  );

drop policy if exists cf_admin_all on public.coach_foods;
create policy cf_admin_all on public.coach_foods
  for all to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');
