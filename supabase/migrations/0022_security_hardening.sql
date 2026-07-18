-- Security hardening: server-side roles, scoped renewals, active subscriptions,
-- and ownership checks. Existing RPC names/signatures are preserved.

-- New accounts always start as players. User-controlled metadata must never
-- choose an authorization role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name', 'player');
  return new;
end;
$$;

-- Users may edit only their display name. Role/email changes remain server-side.
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update_name on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

-- Shared server-side subscription predicate for data and storage policies.
create or replace function public.has_active_subscription(p_player uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.coach_player_links
    where player_id = p_player
      and status = 'active'
      and subscription_end_date >= current_date
  );
$$;
revoke all on function public.has_active_subscription(uuid) from public;
grant execute on function public.has_active_subscription(uuid) to authenticated;

-- Renewal is allowed only for an existing player already linked to this coach.
create or replace function public.coach_create_player_key(
  p_player_id uuid,
  p_end_date date
) returns public.coach_player_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid := (select auth.uid());
  v_key text;
  v_link public.coach_player_links;
begin
  if public.auth_role() != 'coach' then raise exception 'Access denied'; end if;
  if p_end_date <= current_date then raise exception 'End date must be in the future'; end if;
  if not exists (
    select 1 from public.coach_player_links l
    join public.profiles p on p.id = l.player_id
    where l.coach_id = v_coach_id and l.player_id = p_player_id and p.role = 'player'
  ) then
    raise exception 'Player is not linked to this coach';
  end if;

  v_key := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 20));
  update public.coach_player_links
    set subscription_key = v_key, subscription_end_date = p_end_date, status = 'active'
    where coach_id = v_coach_id and player_id = p_player_id
    returning * into v_link;
  return v_link;
end;
$$;
revoke all on function public.coach_create_player_key(uuid, date) from public;
grant execute on function public.coach_create_player_key(uuid, date) to authenticated;

-- Player data access is conditional on an active subscription.
drop policy if exists pd_player_select on public.program_days;
create policy pd_player_select on public.program_days for select to authenticated
  using (player_id = (select auth.uid()) and public.has_active_subscription(player_id));

drop policy if exists wk_player_select on public.workouts;
create policy wk_player_select on public.workouts for select to authenticated
  using (exists (
    select 1 from public.program_days pd
    where pd.id = workouts.program_day_id
      and pd.player_id = (select auth.uid())
      and public.has_active_subscription(pd.player_id)
  ));

drop policy if exists ex_player_select on public.exercises;
create policy ex_player_select on public.exercises for select to authenticated
  using (exists (
    select 1 from public.workouts w
    join public.program_days pd on pd.id = w.program_day_id
    where w.id = exercises.workout_id
      and pd.player_id = (select auth.uid())
      and public.has_active_subscription(pd.player_id)
  ));

drop policy if exists log_player_all on public.exercise_logs;
create policy log_player_all on public.exercise_logs for all to authenticated
  using (player_id = (select auth.uid()) and public.has_active_subscription(player_id))
  with check (
    player_id = (select auth.uid())
    and public.has_active_subscription(player_id)
    and exists (
      select 1 from public.exercises e
      join public.workouts w on w.id = e.workout_id
      join public.program_days pd on pd.id = w.program_day_id
      where e.id = exercise_logs.exercise_id and pd.player_id = (select auth.uid())
    )
  );

drop policy if exists setlog_player_all on public.set_logs;
create policy setlog_player_all on public.set_logs for all to authenticated
  using (exists (
    select 1 from public.exercise_logs el
    where el.id = set_logs.exercise_log_id
      and el.player_id = (select auth.uid())
      and public.has_active_subscription(el.player_id)
  ))
  with check (exists (
    select 1 from public.exercise_logs el
    where el.id = set_logs.exercise_log_id
      and el.player_id = (select auth.uid())
      and public.has_active_subscription(el.player_id)
  ));

drop policy if exists msg_player_select on public.messages;
create policy msg_player_select on public.messages for select to authenticated
  using (player_id = (select auth.uid()) and public.has_active_subscription(player_id));

drop policy if exists dd_player_select on public.diet_days;
create policy dd_player_select on public.diet_days for select to authenticated
  using (player_id = (select auth.uid()) and public.has_active_subscription(player_id));

drop policy if exists "participants read chat" on public.chat_messages;
create policy "participants read chat" on public.chat_messages for select to authenticated
  using (
    coach_id = (select auth.uid())
    or (player_id = (select auth.uid()) and public.has_active_subscription(player_id))
  );

drop policy if exists "player send chat" on public.chat_messages;
create policy "player send chat" on public.chat_messages for insert to authenticated
  with check (
    player_id = (select auth.uid())
    and sender_id = (select auth.uid())
    and public.has_active_subscription(player_id)
    and exists (
      select 1 from public.coach_player_links l
      where l.player_id = (select auth.uid())
        and l.coach_id = chat_messages.coach_id
        and l.status = 'active'
        and l.subscription_end_date >= current_date
    )
  );

drop policy if exists videos_player_read on storage.objects;
create policy videos_player_read on storage.objects for select to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );
drop policy if exists videos_player_write on storage.objects;
create policy videos_player_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );
drop policy if exists videos_player_update on storage.objects;
create policy videos_player_update on storage.objects for update to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );
drop policy if exists videos_player_delete on storage.objects;
create policy videos_player_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );

-- Coaches may check in only players linked to them.
drop policy if exists checkup_coach_all on public.checkups;
create policy checkup_coach_all on public.checkups for all to authenticated
  using (
    public.auth_role() = 'coach'
    and coach_id = (select auth.uid())
    and public.is_my_player(player_id)
  )
  with check (
    public.auth_role() = 'coach'
    and coach_id = (select auth.uid())
    and public.is_my_player(player_id)
  );

-- Limit unbounded user content at the database boundary.
alter table public.chat_messages drop constraint if exists chat_messages_body_length;
alter table public.chat_messages add constraint chat_messages_body_length
  check (char_length(body) between 1 and 5000) not valid;
alter table public.admin_messages drop constraint if exists admin_messages_body_length;
alter table public.admin_messages add constraint admin_messages_body_length
  check (char_length(body) <= 5000) not valid;
