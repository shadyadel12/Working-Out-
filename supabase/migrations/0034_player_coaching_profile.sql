-- Coach-owned notes and goals for each linked player.
create table if not exists public.player_coaching_profiles (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  coach_notes text not null default '' check (char_length(coach_notes) <= 10000),
  client_goals text not null default '' check (char_length(client_goals) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, player_id)
);

alter table public.player_coaching_profiles enable row level security;
create policy player_coaching_profiles_coach_all on public.player_coaching_profiles
for all to authenticated
using (coach_id = (select auth.uid()) and public.is_my_player(player_id))
with check (coach_id = (select auth.uid()) and public.is_my_player(player_id) and public.auth_role() = 'coach');
create policy player_coaching_profiles_admin_all on public.player_coaching_profiles
for all to authenticated using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

create index if not exists player_coaching_profiles_player_idx on public.player_coaching_profiles(player_id);
