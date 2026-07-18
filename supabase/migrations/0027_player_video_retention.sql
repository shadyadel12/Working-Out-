alter table public.exercise_logs
  add column if not exists player_video_viewed_at timestamptz,
  add column if not exists player_video_delete_after timestamptz;

create index if not exists exercise_logs_video_cleanup_idx
  on public.exercise_logs (player_video_delete_after)
  where player_video_url is not null and not player_video_is_external;

create or replace function public.reset_player_video_retention()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.player_video_url is distinct from old.player_video_url
     or new.player_video_is_external is distinct from old.player_video_is_external then
    new.player_video_viewed_at := null;
    new.player_video_delete_after := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reset_player_video_retention on public.exercise_logs;
create trigger trg_reset_player_video_retention
  before update of player_video_url, player_video_is_external on public.exercise_logs
  for each row execute function public.reset_player_video_retention();

create or replace function public.mark_player_video_viewed(p_log_id uuid)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare
  v_now timestamptz := clock_timestamp();
  v_delete_after timestamptz;
begin
  update public.exercise_logs el
  set player_video_viewed_at = coalesce(el.player_video_viewed_at, v_now),
      player_video_delete_after = coalesce(el.player_video_delete_after, v_now + interval '30 days')
  where el.id = p_log_id
    and el.player_video_url is not null
    and not el.player_video_is_external
    and exists (
      select 1 from public.coach_player_links link
      where link.coach_id = auth.uid() and link.player_id = el.player_id
    )
  returning el.player_video_delete_after into v_delete_after;
  if v_delete_after is null then raise exception 'Video not found or access denied'; end if;
  return v_delete_after;
end;
$$;

revoke all on function public.mark_player_video_viewed(uuid) from public;
grant execute on function public.mark_player_video_viewed(uuid) to authenticated;
