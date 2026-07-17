-- Coaches can generate / renew subscription keys for their own players.
-- Uses SECURITY DEFINER so the coach doesn't need direct INSERT/UPDATE
-- permission on coach_player_links (admin owns that table).
create or replace function public.coach_create_player_key(
  p_player_id uuid,
  p_end_date  date
) returns public.coach_player_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid := (select auth.uid());
  v_key      text;
  v_link     public.coach_player_links;
begin
  -- Only coaches may call this.
  if public.auth_role() != 'coach' then
    raise exception 'Access denied';
  end if;

  -- End date must be in the future.
  if p_end_date <= current_date then
    raise exception 'End date must be in the future';
  end if;

  -- Generate a 20-char uppercase random key.
  v_key := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 20));

  -- Create or renew the link for this (coach, player) pair.
  insert into public.coach_player_links
    (coach_id, player_id, subscription_key, subscription_end_date, status)
  values
    (v_coach_id, p_player_id, v_key, p_end_date, 'active')
  on conflict (coach_id, player_id) do update
    set subscription_key      = v_key,
        subscription_end_date = p_end_date,
        status                = 'active'
  returning * into v_link;

  return v_link;
end;
$$;

grant execute on function public.coach_create_player_key(uuid, date) to authenticated;
