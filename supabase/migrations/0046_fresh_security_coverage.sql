-- Fresh security coverage for team invitations, VIP renewals, and check-up schedules.

-- A player renewal must always belong to the coach making the request. Newer
-- overloads added by VIP/check-up features must retain this original boundary.
create or replace function public.coach_create_player_key(
  p_player_id uuid, p_end_date date, p_is_vip boolean default false,
  p_checkup_days int default 3
) returns public.coach_player_links
language plpgsql security definer set search_path = public as $$
declare
  v_coach_id uuid := (select auth.uid());
  v_key text;
  v_link public.coach_player_links;
  v_days int;
  v_weekdays int[];
begin
  if public.auth_role() <> 'coach' then raise exception 'Access denied'; end if;
  if p_player_id is null then raise exception 'Player is required'; end if;
  if p_end_date is null or p_end_date <= current_date then raise exception 'End date must be in the future'; end if;
  if p_checkup_days is null or p_checkup_days not between 1 and 3 then raise exception 'Choose between 1 and 3 check-up days'; end if;
  if not exists (
    select 1 from public.coach_player_links l
    join public.profiles p on p.id = l.player_id and p.role = 'player'
    where l.coach_id = v_coach_id and l.player_id = p_player_id
  ) then raise exception 'Player is not linked to this coach'; end if;

  v_days := case when p_is_vip then 7 else p_checkup_days end;
  v_weekdays := case when p_is_vip then array[0,1,2,3,4,5,6]
    else public.checkup_weekdays_for_count(v_days) end;
  v_key := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 20));
  update public.coach_player_links set
    subscription_key = v_key, subscription_end_date = p_end_date,
    status = 'active', is_vip = p_is_vip,
    checkup_days_per_week = v_days, checkup_weekdays = v_weekdays
  where coach_id = v_coach_id and player_id = p_player_id
  returning * into v_link;
  return v_link;
end;
$$;

-- Keep the three-argument overload safe for older deployed clients.
create or replace function public.coach_create_player_key(
  p_player_id uuid, p_end_date date, p_is_vip boolean
) returns public.coach_player_links
language sql security definer set search_path = public as $$
  select public.coach_create_player_key(p_player_id, p_end_date, p_is_vip, 3)
$$;

revoke all on function public.coach_create_player_key(uuid,date,boolean,int) from public;
revoke all on function public.coach_create_player_key(uuid,date,boolean) from public;
grant execute on function public.coach_create_player_key(uuid,date,boolean,int) to authenticated;
grant execute on function public.coach_create_player_key(uuid,date,boolean) to authenticated;

-- Team keys are for new staff accounts, never for converting an existing client.
create or replace function public.claim_team_invite(p_key text) returns void
language plpgsql security definer set search_path = public as $$
declare v public.coach_team_invites; v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'Sign in is required'; end if;
  if p_key is null or p_key !~ '^TEAM-[A-Z0-9]{12}$' then raise exception 'Invalid or used team key'; end if;
  if exists (select 1 from public.coach_player_links where player_id = v_user)
    or exists (select 1 from public.coach_team_members where member_id = v_user) then
    raise exception 'This account is already connected';
  end if;
  select * into v from public.coach_team_invites
    where invite_key = upper(trim(p_key)) and status = 'pending' for update;
  if not found then raise exception 'Invalid or used team key'; end if;
  if v.owner_coach_id = v_user then raise exception 'A coach cannot claim their own invitation'; end if;
  update public.profiles set role = 'coach' where id = v_user and role = 'player';
  if not found then raise exception 'This account cannot claim a team key'; end if;
  insert into public.coach_team_members(owner_coach_id,member_id,role)
    values(v.owner_coach_id,v_user,v.role);
  update public.coach_team_invites set status='claimed',claimed_by=v_user,claimed_at=now()
    where id=v.id;
end;
$$;
revoke all on function public.claim_team_invite(text) from public;
grant execute on function public.claim_team_invite(text) to authenticated;

-- Ensure stored schedules always match their frequency and VIP state.
create or replace function public.valid_checkup_weekdays(p_days int[]) returns boolean
language sql immutable set search_path = public as $$
  select p_days is not null
    and cardinality(p_days) = (select count(distinct day) from unnest(p_days) day)
    and p_days <@ array[0,1,2,3,4,5,6]
$$;
alter table public.coach_player_links drop constraint if exists checkup_schedule_consistent;
alter table public.coach_player_links add constraint checkup_schedule_consistent check (
  cardinality(checkup_weekdays) = checkup_days_per_week
  and public.valid_checkup_weekdays(checkup_weekdays)
  and ((is_vip and checkup_days_per_week = 7) or (not is_vip and checkup_days_per_week between 1 and 3))
) not valid;
