-- Enforce coach-team roles on the server. The mobile UI mirrors these rules,
-- but these policies remain authoritative if a client is modified.

create or replace function public.team_owner_for_member(p_member uuid default auth.uid())
returns uuid language sql stable security definer set search_path=public, pg_temp
as $$
  select owner_coach_id from public.coach_team_members
  where member_id=p_member and status='active' order by created_at limit 1
$$;

create or replace function public.team_role_for_member(p_member uuid default auth.uid())
returns public.team_role language sql stable security definer set search_path=public, pg_temp
as $$
  select role from public.coach_team_members
  where member_id=p_member and status='active' order by created_at limit 1
$$;

create or replace function public.team_has_assignment(p_owner uuid,p_player uuid,p_roles public.team_role[])
returns boolean language sql stable security definer set search_path=public, pg_temp
as $$
  select exists(
    select 1 from public.coach_team_members m
    join public.coach_team_assignments a
      on a.owner_coach_id=m.owner_coach_id and a.member_id=m.member_id
    where m.member_id=(select auth.uid()) and m.owner_coach_id=p_owner
      and m.status='active' and m.role=any(p_roles) and a.player_id=p_player
  )
$$;

create or replace function public.team_can_view_player(p_owner uuid,p_player uuid)
returns boolean language sql stable security definer set search_path=public, pg_temp as $$
 select public.team_has_assignment(p_owner,p_player,array['viewer','chat','head_coach','sales']::public.team_role[])
$$;
create or replace function public.team_can_chat_player(p_owner uuid,p_player uuid)
returns boolean language sql stable security definer set search_path=public, pg_temp as $$
 select public.team_has_assignment(p_owner,p_player,array['chat','head_coach']::public.team_role[])
$$;
create or replace function public.team_can_manage_player(p_owner uuid,p_player uuid)
returns boolean language sql stable security definer set search_path=public, pg_temp as $$
 select public.team_has_assignment(p_owner,p_player,array['head_coach']::public.team_role[])
$$;
create or replace function public.team_can_sell_player(p_owner uuid,p_player uuid)
returns boolean language sql stable security definer set search_path=public, pg_temp as $$
 select public.team_has_assignment(p_owner,p_player,array['sales']::public.team_role[])
$$;
create or replace function public.team_can_sell_for_owner(p_owner uuid)
returns boolean language sql stable security definer set search_path=public, pg_temp as $$
 select exists(select 1 from public.coach_team_members where member_id=(select auth.uid())
   and owner_coach_id=p_owner and status='active' and role='sales')
$$;

revoke all on function public.team_owner_for_member(uuid) from public;
revoke all on function public.team_role_for_member(uuid) from public;
revoke all on function public.team_has_assignment(uuid,uuid,public.team_role[]) from public;
revoke all on function public.team_can_view_player(uuid,uuid) from public;
revoke all on function public.team_can_chat_player(uuid,uuid) from public;
revoke all on function public.team_can_manage_player(uuid,uuid) from public;
revoke all on function public.team_can_sell_player(uuid,uuid) from public;
revoke all on function public.team_can_sell_for_owner(uuid) from public;
grant execute on function public.team_owner_for_member(uuid), public.team_role_for_member(uuid),
 public.team_can_view_player(uuid,uuid), public.team_can_chat_player(uuid,uuid),
 public.team_can_manage_player(uuid,uuid), public.team_can_sell_player(uuid,uuid),
 public.team_can_sell_for_owner(uuid) to authenticated;

drop policy if exists profiles_team_assigned_read on public.profiles;
drop policy if exists links_team_assigned_read on public.coach_player_links;
create policy cpl_team_assigned_read on public.coach_player_links for select to authenticated
using ((player_id is not null and public.team_can_view_player(coach_id,player_id)) or public.team_can_sell_for_owner(coach_id));
create policy profiles_team_role_read on public.profiles for select to authenticated
using (exists(select 1 from public.coach_team_assignments a where a.player_id=profiles.id
  and public.team_can_view_player(a.owner_coach_id,a.player_id)));
create policy player_details_team_read on public.player_details for select to authenticated
using (exists(select 1 from public.coach_team_assignments a where a.player_id=player_details.player_id
  and public.team_can_view_player(a.owner_coach_id,a.player_id)));

create policy pd_team_read on public.program_days for select to authenticated
using (public.team_can_view_player(coach_id,player_id));
create policy pd_team_insert on public.program_days for insert to authenticated
with check (public.team_can_manage_player(coach_id,player_id));
create policy pd_team_update on public.program_days for update to authenticated
using (public.team_can_manage_player(coach_id,player_id)) with check (public.team_can_manage_player(coach_id,player_id));
create policy pd_team_delete on public.program_days for delete to authenticated
using (public.team_can_manage_player(coach_id,player_id));

create policy workouts_team_read on public.workouts for select to authenticated using(exists(
 select 1 from public.program_days d where d.id=workouts.program_day_id and public.team_can_view_player(d.coach_id,d.player_id)));
create policy workouts_team_write on public.workouts for all to authenticated using(exists(
 select 1 from public.program_days d where d.id=workouts.program_day_id and public.team_can_manage_player(d.coach_id,d.player_id)))
with check(exists(select 1 from public.program_days d where d.id=workouts.program_day_id and public.team_can_manage_player(d.coach_id,d.player_id)));
create policy exercises_team_read on public.exercises for select to authenticated using(exists(
 select 1 from public.workouts w join public.program_days d on d.id=w.program_day_id
 where w.id=exercises.workout_id and public.team_can_view_player(d.coach_id,d.player_id)));
create policy exercises_team_write on public.exercises for all to authenticated using(exists(
 select 1 from public.workouts w join public.program_days d on d.id=w.program_day_id
 where w.id=exercises.workout_id and public.team_can_manage_player(d.coach_id,d.player_id)))
with check(exists(select 1 from public.workouts w join public.program_days d on d.id=w.program_day_id
 where w.id=exercises.workout_id and public.team_can_manage_player(d.coach_id,d.player_id)));

create policy diet_days_team_read on public.diet_days for select to authenticated
using(public.team_can_view_player(coach_id,player_id));
create policy diet_days_team_write on public.diet_days for all to authenticated
using(public.team_can_manage_player(coach_id,player_id)) with check(public.team_can_manage_player(coach_id,player_id));
create policy exercise_logs_team_read on public.exercise_logs for select to authenticated
using(exists(select 1 from public.coach_player_links l where l.player_id=exercise_logs.player_id
 and public.team_can_view_player(l.coach_id,l.player_id)));
create policy set_logs_team_read on public.set_logs for select to authenticated using(exists(
 select 1 from public.exercise_logs e join public.coach_player_links l on l.player_id=e.player_id
 where e.id=set_logs.exercise_log_id and public.team_can_view_player(l.coach_id,l.player_id)));
create policy diet_logs_team_read on public.diet_logs for select to authenticated
using(public.team_can_view_player(coach_id,player_id));

-- Head coaches may use, but not alter, the owner's reusable libraries.
create policy exercise_library_team_read on public.exercise_library for select to authenticated
using(public.team_owner_for_member()=coach_id and public.team_role_for_member()='head_coach');
create policy workout_templates_team_read on public.workout_templates for select to authenticated
using(public.team_owner_for_member()=coach_id and public.team_role_for_member()='head_coach');
create policy workout_template_exercises_team_read on public.workout_template_exercises for select to authenticated
using(exists(select 1 from public.workout_templates t where t.id=template_id
 and public.team_owner_for_member()=t.coach_id and public.team_role_for_member()='head_coach'));
create policy diet_templates_team_read on public.diet_templates for select to authenticated
using(public.team_owner_for_member()=coach_id and public.team_role_for_member()='head_coach');
create policy program_templates_team_read on public.program_templates for select to authenticated
using(public.team_owner_for_member()=coach_id and public.team_role_for_member()='head_coach');
create policy program_template_days_team_read on public.program_template_days for select to authenticated
using(exists(select 1 from public.program_templates p where p.id=program_template_id
 and public.team_owner_for_member()=p.coach_id and public.team_role_for_member()='head_coach'));
create policy program_template_day_workouts_team_read on public.program_template_day_workouts for select to authenticated
using(exists(select 1 from public.program_template_days d join public.program_templates p on p.id=d.program_template_id
 where d.id=program_template_day_id and public.team_owner_for_member()=p.coach_id and public.team_role_for_member()='head_coach'));

create policy coaching_profiles_team_read on public.player_coaching_profiles for select to authenticated
using(public.team_can_view_player(coach_id,player_id));
create policy coaching_profiles_team_write on public.player_coaching_profiles for all to authenticated
using(public.team_can_manage_player(coach_id,player_id)) with check(public.team_can_manage_player(coach_id,player_id));
create policy checkups_team_read on public.checkups for select to authenticated
using(public.team_can_view_player(coach_id,player_id));
create policy checkups_team_write on public.checkups for all to authenticated
using(public.team_can_manage_player(coach_id,player_id)) with check(public.team_can_manage_player(coach_id,player_id));

create policy chat_team_read on public.chat_messages for select to authenticated
using(public.team_can_chat_player(coach_id,player_id));
create policy chat_team_send on public.chat_messages for insert to authenticated
with check(sender_id=(select auth.uid()) and public.team_can_chat_player(coach_id,player_id));
create policy messages_team_read on public.messages for select to authenticated
using(public.team_can_chat_player(coach_id,player_id));
create policy messages_team_send on public.messages for insert to authenticated
with check(public.team_can_chat_player(coach_id,player_id));

create policy chat_attachment_team_insert on storage.objects for insert to authenticated with check(
 bucket_id='chat-attachments' and (storage.foldername(name))[3]=(select auth.uid())::text
 and public.team_can_chat_player(((storage.foldername(name))[1])::uuid,((storage.foldername(name))[2])::uuid));
create policy chat_attachment_team_read on storage.objects for select to authenticated using(
 bucket_id='chat-attachments'
 and public.team_can_chat_player(((storage.foldername(name))[1])::uuid,((storage.foldername(name))[2])::uuid));

create or replace function public.assign_workout_template(p_program_day_id uuid,p_template_id uuid,p_position int default 0)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_workout uuid; v_owner uuid; v_player uuid;
begin
 select coach_id,player_id into v_owner,v_player from public.program_days where id=p_program_day_id;
 if not found or not (v_owner=(select auth.uid()) or public.team_can_manage_player(v_owner,v_player))
   or not exists(select 1 from public.workout_templates where id=p_template_id and coach_id=v_owner) then raise exception 'Access denied'; end if;
 insert into public.workouts(program_day_id,position,name,template_id) values(p_program_day_id,p_position,null,p_template_id) returning id into v_workout;
 insert into public.exercises(workout_id,position,name,template_exercise_id,is_template_override,target_sets,target_reps,target_weight,coach_video_url,coach_video_is_external,coach_comment)
 select v_workout,e.position,null,e.id,false,null,null,null,null,false,null from public.workout_template_exercises e where e.template_id=p_template_id order by e.position;
 return v_workout;
end$$;

create or replace function public.assign_diet_template(p_player_id uuid,p_week int,p_day_of_week int,p_template_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_day uuid; v_owner uuid;
begin
 select coach_id into v_owner from public.coach_player_links where player_id=p_player_id
  and (coach_id=(select auth.uid()) or public.team_can_manage_player(coach_id,p_player_id)) limit 1;
 if v_owner is null or p_week<1 or p_day_of_week not between 0 and 6
  or not exists(select 1 from public.diet_templates where id=p_template_id and coach_id=v_owner) then raise exception 'Access denied or invalid diet day'; end if;
 insert into public.diet_days(player_id,coach_id,week_number,day_of_week,meals,comment,template_id,is_template_override)
 values(p_player_id,v_owner,p_week,p_day_of_week,'[]',null,p_template_id,false)
 on conflict(player_id,week_number,day_of_week) do update set coach_id=excluded.coach_id,meals='[]',comment=null,template_id=excluded.template_id,is_template_override=false,updated_at=now()
 returning id into v_day; return v_day;
end$$;

revoke all on function public.assign_workout_template(uuid,uuid,int), public.assign_diet_template(uuid,int,int,uuid) from public;
grant execute on function public.assign_workout_template(uuid,uuid,int), public.assign_diet_template(uuid,int,int,uuid) to authenticated;

-- Sales staff can generate access only for their owner's account. Assigned
-- renewals stay player-scoped; new keys are owner-scoped.
create or replace function public.coach_create_unclaimed_key(p_end_date date,p_is_vip boolean default false,p_checkup_days int default 3)
returns public.coach_player_links language plpgsql security definer set search_path=public,pg_temp as $$
declare v_actor uuid:=(select auth.uid()); v_owner uuid; v_key text; v_link public.coach_player_links;
 v_days int; v_weekdays int[];
begin
 v_owner:=coalesce(public.team_owner_for_member(v_actor),v_actor);
 if public.auth_role()<>'coach' or (v_actor<>v_owner and not public.team_can_sell_for_owner(v_owner)) then raise exception 'Access denied'; end if;
 if p_end_date<=current_date then raise exception 'End date must be in the future'; end if;
 if p_checkup_days not between 1 and 3 then raise exception 'Choose between 1 and 3 check-up days'; end if;
 v_days:=case when p_is_vip then 7 else p_checkup_days end;
 v_weekdays:=case when p_is_vip then array[0,1,2,3,4,5,6] else public.checkup_weekdays_for_count(v_days) end;
 v_key:=upper(substring(replace(gen_random_uuid()::text,'-',''),1,20));
 insert into public.coach_player_links(coach_id,player_id,subscription_key,subscription_end_date,status,is_vip,checkup_days_per_week,checkup_weekdays)
 values(v_owner,null,v_key,p_end_date,'active',p_is_vip,v_days,v_weekdays) returning * into v_link;
 return v_link;
end$$;

create or replace function public.coach_create_player_key(p_player_id uuid,p_end_date date,p_is_vip boolean default false,p_checkup_days int default 3)
returns public.coach_player_links language plpgsql security definer set search_path=public,pg_temp as $$
declare v_actor uuid:=(select auth.uid()); v_owner uuid; v_key text; v_link public.coach_player_links;
 v_days int; v_weekdays int[];
begin
 v_owner:=coalesce(public.team_owner_for_member(v_actor),v_actor);
 if public.auth_role()<>'coach' or (v_actor<>v_owner and not public.team_can_sell_player(v_owner,p_player_id)) then raise exception 'Access denied'; end if;
 if not exists(select 1 from public.coach_player_links where coach_id=v_owner and player_id=p_player_id) then raise exception 'Player is not linked to this coach'; end if;
 if p_end_date<=current_date then raise exception 'End date must be in the future'; end if;
 if p_checkup_days not between 1 and 3 then raise exception 'Choose between 1 and 3 check-up days'; end if;
 v_days:=case when p_is_vip then 7 else p_checkup_days end;
 v_weekdays:=case when p_is_vip then array[0,1,2,3,4,5,6] else public.checkup_weekdays_for_count(v_days) end;
 v_key:=upper(substring(replace(gen_random_uuid()::text,'-',''),1,20));
 update public.coach_player_links set subscription_key=v_key,subscription_end_date=p_end_date,status='active',is_vip=p_is_vip,
  checkup_days_per_week=v_days,checkup_weekdays=v_weekdays where coach_id=v_owner and player_id=p_player_id returning * into v_link;
 return v_link;
end$$;

create or replace function public.coach_create_unclaimed_key(p_end_date date,p_is_vip boolean default false)
returns public.coach_player_links language sql security definer set search_path=public,pg_temp as $$
 select public.coach_create_unclaimed_key(p_end_date,p_is_vip,3)
$$;
create or replace function public.coach_create_unclaimed_key(p_end_date date)
returns public.coach_player_links language sql security definer set search_path=public,pg_temp as $$
 select public.coach_create_unclaimed_key(p_end_date,false,3)
$$;
create or replace function public.coach_create_player_key(p_player_id uuid,p_end_date date,p_is_vip boolean default false)
returns public.coach_player_links language sql security definer set search_path=public,pg_temp as $$
 select public.coach_create_player_key(p_player_id,p_end_date,p_is_vip,3)
$$;
create or replace function public.coach_create_player_key(p_player_id uuid,p_end_date date)
returns public.coach_player_links language sql security definer set search_path=public,pg_temp as $$
 select public.coach_create_player_key(p_player_id,p_end_date,false,3)
$$;

revoke all on function public.coach_create_unclaimed_key(date,boolean,int) from public;
revoke all on function public.coach_create_unclaimed_key(date,boolean) from public;
revoke all on function public.coach_create_unclaimed_key(date) from public;
revoke all on function public.coach_create_player_key(uuid,date,boolean,int) from public;
revoke all on function public.coach_create_player_key(uuid,date,boolean) from public;
revoke all on function public.coach_create_player_key(uuid,date) from public;
grant execute on function public.coach_create_unclaimed_key(date,boolean,int), public.coach_create_unclaimed_key(date,boolean),
 public.coach_create_unclaimed_key(date), public.coach_create_player_key(uuid,date,boolean,int),
 public.coach_create_player_key(uuid,date,boolean), public.coach_create_player_key(uuid,date) to authenticated;
