-- Private chat between a coach and a player.
create table public.chat_messages (
  id          uuid        primary key default gen_random_uuid(),
  coach_id    uuid        not null references public.profiles(id) on delete cascade,
  player_id   uuid        not null references public.profiles(id) on delete cascade,
  sender_id   uuid        not null references public.profiles(id) on delete cascade,
  body        text        not null check (char_length(body) > 0),
  created_at  timestamptz not null default now()
);

create index on public.chat_messages (coach_id, player_id, created_at);

alter table public.chat_messages enable row level security;

-- Admin: full access
create policy "admin full access on chat_messages" on public.chat_messages
  for all to authenticated
  using  ((select role from public.profiles where id = (select auth.uid())) = 'admin')
  with check ((select role from public.profiles where id = (select auth.uid())) = 'admin');

-- Participants can read any message they are part of
create policy "participants read chat" on public.chat_messages
  for select to authenticated
  using (
    coach_id  = (select auth.uid()) or
    player_id = (select auth.uid())
  );

-- Coach can send messages to their linked players
create policy "coach send chat" on public.chat_messages
  for insert to authenticated
  with check (
    coach_id  = (select auth.uid()) and
    sender_id = (select auth.uid()) and
    is_my_player(player_id)
  );

-- Player can send messages to their coach
create policy "player send chat" on public.chat_messages
  for insert to authenticated
  with check (
    player_id = (select auth.uid()) and
    sender_id = (select auth.uid())
  );
