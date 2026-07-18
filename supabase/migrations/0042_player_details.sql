-- Player-completed personal and training details.
create table if not exists public.player_details (
  player_id uuid primary key references public.profiles(id) on delete cascade,
  gender text not null check (char_length(gender) between 1 and 50),
  date_of_birth date not null,
  height text not null check (char_length(height) between 1 and 50),
  country text not null check (char_length(country) between 1 and 100),
  mobile_number text not null check (char_length(mobile_number) between 3 and 30),
  sport text not null check (char_length(sport) between 1 and 100),
  position text not null check (char_length(position) between 1 and 100),
  sport_level text not null check (char_length(sport_level) between 1 and 100),
  experience_level text not null check (char_length(experience_level) between 1 and 100),
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.player_details enable row level security;
create policy player_details_own_all on public.player_details for all to authenticated
using (player_id=(select auth.uid())) with check (player_id=(select auth.uid()) and public.auth_role()='player');
create policy player_details_linked_coach_read on public.player_details for select to authenticated
using (public.auth_role()='coach' and public.is_my_player(player_id));
create policy player_details_admin_all on public.player_details for all to authenticated
using (public.auth_role()='admin') with check (public.auth_role()='admin');
