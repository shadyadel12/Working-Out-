-- Reject every admin SECURITY DEFINER operation unless auth_role() resolves to
-- admin. auth_role() intentionally returns NULL for admin AAL1 sessions, so
-- IS DISTINCT FROM is required; NULL <> 'admin' does not enter an IF branch.

create or replace function public.admin_create_key(
  p_coach_id uuid,
  p_key text,
  p_end_date date
)
returns public.coach_player_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.coach_player_links;
begin
  if public.auth_role() is distinct from 'admin'::public.user_role then
    raise exception 'Admin MFA required';
  end if;
  if not exists (select 1 from public.profiles where id = p_coach_id and role = 'coach') then
    raise exception 'coach_id is not a coach';
  end if;

  insert into public.coach_player_links (coach_id, player_id, subscription_key, subscription_end_date, status)
    values (p_coach_id, null, trim(p_key), p_end_date, 'active')
    returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.admin_update_key(
  p_key_id uuid,
  p_end_date date,
  p_status public.link_status
)
returns public.coach_player_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.coach_player_links;
begin
  if public.auth_role() is distinct from 'admin'::public.user_role then
    raise exception 'Admin MFA required';
  end if;
  update public.coach_player_links
    set subscription_end_date = coalesce(p_end_date, subscription_end_date),
        status = coalesce(p_status, status)
    where id = p_key_id
    returning * into v_row;
  if not found then
    raise exception 'Key not found';
  end if;
  return v_row;
end;
$$;

create or replace function public.admin_create_coach_key(p_key text)
returns public.coach_keys
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.coach_keys;
begin
  if public.auth_role() is distinct from 'admin'::public.user_role then
    raise exception 'Admin MFA required';
  end if;
  insert into public.coach_keys (key) values (trim(p_key)) returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.admin_revoke_coach_key(p_key_id uuid)
returns public.coach_keys
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.coach_keys;
begin
  if public.auth_role() is distinct from 'admin'::public.user_role then
    raise exception 'Admin MFA required';
  end if;
  update public.coach_keys set status = 'revoked' where id = p_key_id returning * into v_row;
  if not found then raise exception 'Coach key not found'; end if;
  return v_row;
end;
$$;

revoke all on function public.admin_create_key(uuid, text, date) from public;
revoke all on function public.admin_update_key(uuid, date, public.link_status) from public;
revoke all on function public.admin_create_coach_key(text) from public;
revoke all on function public.admin_revoke_coach_key(uuid) from public;
grant execute on function public.admin_create_key(uuid, text, date) to authenticated;
grant execute on function public.admin_update_key(uuid, date, public.link_status) to authenticated;
grant execute on function public.admin_create_coach_key(text) to authenticated;
grant execute on function public.admin_revoke_coach_key(uuid) to authenticated;
