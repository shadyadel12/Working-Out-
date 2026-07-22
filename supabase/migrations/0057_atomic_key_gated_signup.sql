-- Make access-key consumption part of auth.users creation so a failed claim
-- rolls back the Auth user and profile instead of leaving an orphan account.
-- Also record the exact account that generates each new player access key.

alter table public.coach_player_links
  add column if not exists key_generated_by uuid references public.profiles(id) on delete set null,
  add column if not exists key_generated_at timestamptz;

alter table public.coach_keys
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create index if not exists coach_player_links_key_generated_by_idx
  on public.coach_player_links(key_generated_by);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_signup_type text := lower(trim(coalesce(new.raw_user_meta_data ->> 'signup_type', '')));
  v_access_key text := trim(coalesce(new.raw_user_meta_data ->> 'access_key', ''));
  v_player_key public.coach_player_links;
  v_coach_key public.coach_keys;
  v_team_key public.coach_team_invites;
begin
  if v_access_key = '' then
    raise exception 'A valid access key is required';
  end if;

  if v_signup_type = 'player' then
    select * into v_player_key
    from public.coach_player_links
    where subscription_key = v_access_key
      and status = 'active'
      and subscription_end_date >= current_date
      and player_id is null
    for update;

    if not found then
      raise exception 'Invalid, expired, or already-used player key';
    end if;

    insert into public.profiles (id, email, name, role)
    values (new.id, new.email, new.raw_user_meta_data ->> 'name', 'player');

    update public.coach_player_links
    set player_id = new.id
    where id = v_player_key.id;

  elsif v_signup_type = 'coach' then
    select * into v_coach_key
    from public.coach_keys
    where key = v_access_key
      and status = 'active'
      and claimed_by is null
    for update;

    if not found then
      raise exception 'Invalid or already-used coach key';
    end if;

    insert into public.profiles (id, email, name, role)
    values (new.id, new.email, new.raw_user_meta_data ->> 'name', 'coach');

    update public.coach_keys
    set claimed_by = new.id
    where id = v_coach_key.id;

  elsif v_signup_type = 'team' then
    select * into v_team_key
    from public.coach_team_invites
    where invite_key = upper(v_access_key)
      and status = 'pending'
    for update;

    if not found then
      raise exception 'Invalid or already-used team key';
    end if;

    insert into public.profiles (id, email, name, role)
    values (new.id, new.email, new.raw_user_meta_data ->> 'name', 'coach');

    insert into public.coach_team_members (owner_coach_id, member_id, role)
    values (v_team_key.owner_coach_id, new.id, v_team_key.role);

    update public.coach_team_invites
    set status = 'claimed', claimed_by = new.id, claimed_at = now()
    where id = v_team_key.id;

  else
    raise exception 'A valid signup type and access key are required';
  end if;

  -- The key is single-use and should not remain in user metadata after the
  -- transaction has consumed it successfully.
  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'access_key'
  where id = new.id;

  return new;
end;
$$;

create or replace function public.check_subscription_key(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.coach_player_links
    where subscription_key = trim(p_key)
      and status = 'active'
      and subscription_end_date >= current_date
      and player_id is null
  );
$$;

create or replace function public.check_coach_key(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.coach_keys
    where key = trim(p_key)
      and status = 'active'
      and claimed_by is null
  );
$$;

create or replace function public.check_team_invite(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.coach_team_invites
    where invite_key = upper(trim(p_key))
      and status = 'pending'
  );
$$;

create or replace function public.admin_create_key(
  p_coach_id uuid,
  p_key text,
  p_end_date date
)
returns public.coach_player_links
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_row public.coach_player_links;
begin
  if public.auth_role() is distinct from 'admin'::public.user_role then
    raise exception 'Admin MFA required';
  end if;
  if not exists (select 1 from public.profiles where id = p_coach_id and role = 'coach') then
    raise exception 'coach_id is not a coach';
  end if;
  if p_end_date < current_date then
    raise exception 'End date must not be in the past';
  end if;

  insert into public.coach_player_links
    (coach_id, player_id, subscription_key, subscription_end_date, status,
     key_generated_by, key_generated_at)
  values
    (p_coach_id, null, trim(p_key), p_end_date, 'active', v_actor, now())
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.admin_create_coach_key(p_key text)
returns public.coach_keys
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_row public.coach_keys;
begin
  if public.auth_role() is distinct from 'admin'::public.user_role then
    raise exception 'Admin MFA required';
  end if;

  insert into public.coach_keys (key, created_by)
  values (trim(p_key), v_actor)
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.coach_create_unclaimed_key(
  p_end_date date,
  p_is_vip boolean default false,
  p_checkup_days int default 3
)
returns public.coach_player_links
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_owner uuid;
  v_key text;
  v_link public.coach_player_links;
  v_days int;
  v_weekdays int[];
begin
  v_owner := coalesce(public.team_owner_for_member(v_actor), v_actor);
  if public.auth_role() <> 'coach'
     or (v_actor <> v_owner and not public.team_can_sell_for_owner(v_owner)) then
    raise exception 'Access denied';
  end if;
  if p_end_date <= current_date then
    raise exception 'End date must be in the future';
  end if;
  if p_checkup_days not between 1 and 3 then
    raise exception 'Choose between 1 and 3 check-up days';
  end if;

  v_days := case when p_is_vip then 7 else p_checkup_days end;
  v_weekdays := case when p_is_vip then array[0,1,2,3,4,5,6]
                     else public.checkup_weekdays_for_count(v_days) end;
  v_key := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 20));

  insert into public.coach_player_links
    (coach_id, player_id, subscription_key, subscription_end_date, status,
     is_vip, checkup_days_per_week, checkup_weekdays,
     key_generated_by, key_generated_at)
  values
    (v_owner, null, v_key, p_end_date, 'active',
     p_is_vip, v_days, v_weekdays, v_actor, now())
  returning * into v_link;
  return v_link;
end;
$$;

create or replace function public.coach_create_player_key(
  p_player_id uuid,
  p_end_date date,
  p_is_vip boolean default false,
  p_checkup_days int default 3
)
returns public.coach_player_links
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_owner uuid;
  v_key text;
  v_link public.coach_player_links;
  v_days int;
  v_weekdays int[];
begin
  v_owner := coalesce(public.team_owner_for_member(v_actor), v_actor);
  if public.auth_role() <> 'coach'
     or (v_actor <> v_owner and not public.team_can_sell_player(v_owner, p_player_id)) then
    raise exception 'Access denied';
  end if;
  if not exists (
    select 1 from public.coach_player_links
    where coach_id = v_owner and player_id = p_player_id
  ) then
    raise exception 'Player is not linked to this coach';
  end if;
  if p_end_date <= current_date then
    raise exception 'End date must be in the future';
  end if;
  if p_checkup_days not between 1 and 3 then
    raise exception 'Choose between 1 and 3 check-up days';
  end if;

  v_days := case when p_is_vip then 7 else p_checkup_days end;
  v_weekdays := case when p_is_vip then array[0,1,2,3,4,5,6]
                     else public.checkup_weekdays_for_count(v_days) end;
  v_key := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 20));

  update public.coach_player_links
  set subscription_key = v_key,
      subscription_end_date = p_end_date,
      status = 'active',
      is_vip = p_is_vip,
      checkup_days_per_week = v_days,
      checkup_weekdays = v_weekdays,
      key_generated_by = v_actor,
      key_generated_at = now()
  where coach_id = v_owner and player_id = p_player_id
  returning * into v_link;
  return v_link;
end;
$$;

comment on column public.coach_player_links.key_generated_by is
  'Exact authenticated account that generated the current player access key.';
comment on column public.coach_player_links.key_generated_at is
  'Time the current player access key was generated.';
comment on column public.coach_keys.created_by is
  'Exact authenticated administrator account that generated the coach key.';
