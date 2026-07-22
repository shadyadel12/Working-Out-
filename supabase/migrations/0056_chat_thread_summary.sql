-- Return one latest message per coach/player thread instead of making clients
-- download and group up to 1,000 messages on every inbox refresh.
create index if not exists chat_messages_thread_latest_idx
  on public.chat_messages (coach_id, player_id, created_at desc);

create or replace function public.get_coach_chat_threads(p_coach_id uuid)
returns table (
  player_id uuid,
  sender_id uuid,
  body text,
  attachment_type text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct on (message.player_id)
    message.player_id,
    message.sender_id,
    message.body,
    message.attachment_type,
    message.created_at
  from public.chat_messages as message
  where message.coach_id = p_coach_id
  order by message.player_id, message.created_at desc;
$$;

revoke all on function public.get_coach_chat_threads(uuid) from public;
grant execute on function public.get_coach_chat_threads(uuid) to authenticated;
