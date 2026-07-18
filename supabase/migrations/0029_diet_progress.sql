-- Daily diet adherence logs, visible only to the player, their coach, and admins.
create table public.diet_logs (
  id uuid primary key default gen_random_uuid(),
  diet_day_id uuid not null references public.diet_days(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  completed_meals int not null check (completed_meals >= 0),
  total_meals int not null check (total_meals > 0 and completed_meals <= total_meals),
  player_comment text check (player_comment is null or char_length(player_comment) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, log_date)
);

create index diet_logs_player_date_idx on public.diet_logs (player_id, log_date desc);
alter table public.diet_logs enable row level security;

create policy diet_logs_player_read on public.diet_logs for select to authenticated
using (player_id = (select auth.uid()) and public.has_active_subscription(player_id));

create policy diet_logs_player_insert on public.diet_logs for insert to authenticated
with check (
  player_id = (select auth.uid())
  and public.has_active_subscription(player_id)
  and exists (
    select 1 from public.diet_days d
    where d.id = diet_logs.diet_day_id
      and d.player_id = diet_logs.player_id
      and d.coach_id = diet_logs.coach_id
  )
);

create policy diet_logs_player_update on public.diet_logs for update to authenticated
using (player_id = (select auth.uid()) and public.has_active_subscription(player_id))
with check (
  player_id = (select auth.uid())
  and public.has_active_subscription(player_id)
  and exists (
    select 1 from public.diet_days d
    where d.id = diet_logs.diet_day_id
      and d.player_id = diet_logs.player_id
      and d.coach_id = diet_logs.coach_id
  )
);

create policy diet_logs_coach_read on public.diet_logs for select to authenticated
using (coach_id = (select auth.uid()) and public.is_my_player(player_id));

create policy diet_logs_admin_all on public.diet_logs for all to authenticated
using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
