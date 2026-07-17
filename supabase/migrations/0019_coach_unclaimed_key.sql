-- Coach creates a fresh unclaimed key (no player attached yet).
-- A player claims it at login via claim_subscription_key(key).
create or replace function public.coach_create_unclaimed_key(
  p_end_date date
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
  if public.auth_role() != 'coach' then
    raise exception 'Access denied';
  end if;
  if p_end_date <= current_date then
    raise exception 'End date must be in the future';
  end if;
  -- 20-char uppercase random key
  v_key := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 20));
  insert into public.coach_player_links
    (coach_id, player_id, subscription_key, subscription_end_date, status)
  values
    (v_coach_id, null, v_key, p_end_date, 'active')
  returning * into v_link;
  return v_link;
end;
$$;
grant execute on function public.coach_create_unclaimed_key(date) to authenticated;
