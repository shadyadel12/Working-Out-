-- Dedicated diet plan: one row per (player, week, day), meals stored as jsonb.
-- meals = [{ "type": "meal" | "snack", "label": "Meal 1", "content": "..." }, ...]
create table public.diet_days (
  id           uuid        primary key default gen_random_uuid(),
  player_id    uuid        not null references public.profiles(id) on delete cascade,
  coach_id     uuid        not null references public.profiles(id) on delete cascade,
  week_number  int         not null check (week_number >= 1),
  day_of_week  int         not null check (day_of_week between 0 and 6),
  meals        jsonb       not null default '[]',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (player_id, week_number, day_of_week)
);

create index on public.diet_days (player_id, week_number);

alter table public.diet_days enable row level security;

create policy dd_player_select on public.diet_days
  for select to authenticated
  using (player_id = (select auth.uid()));

create policy dd_coach_select on public.diet_days
  for select to authenticated
  using (public.auth_role() = 'coach' and public.is_my_player(player_id));

create policy dd_coach_insert on public.diet_days
  for insert to authenticated
  with check (
    public.auth_role() = 'coach'
    and coach_id = (select auth.uid())
    and public.is_my_player(player_id)
  );

create policy dd_coach_update on public.diet_days
  for update to authenticated
  using (public.auth_role() = 'coach' and public.is_my_player(player_id))
  with check (public.auth_role() = 'coach' and public.is_my_player(player_id));

create policy dd_coach_delete on public.diet_days
  for delete to authenticated
  using (public.auth_role() = 'coach' and public.is_my_player(player_id));

create policy dd_admin_all on public.diet_days
  for all to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');
