-- Keep the existing delivery workflow while casting its status explicitly.
create or replace function public.create_program_delivery(p_player_id uuid,p_program_template_id uuid,p_starts_on date,p_starts_at_day int default 1,p_sync_mode public.delivery_sync_mode default 'snapshot')
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_program public.program_templates;v_snapshot jsonb;v_delivery uuid;v_end date;
begin
 if not public.is_my_player(p_player_id) then raise exception 'Player is not linked to this coach';end if;
 select * into v_program from public.program_templates where id=p_program_template_id and coach_id=(select auth.uid()) and deleted_at is null;
 if not found then raise exception 'Program template not found';end if;
 if p_starts_at_day<1 or p_starts_at_day>(v_program.duration_weeks*7) then raise exception 'Starting day is outside this program';end if;
 select jsonb_build_object('program',to_jsonb(v_program),'days',coalesce(jsonb_agg(jsonb_build_object('day',to_jsonb(d),'workouts',(select coalesce(jsonb_agg(to_jsonb(w) order by w.position),'[]'::jsonb) from public.program_template_day_workouts w where w.program_template_day_id=d.id)) order by d.week_number,d.day_number),'[]'::jsonb)) into v_snapshot from public.program_template_days d where d.program_template_id=v_program.id;
 v_end:=p_starts_on+greatest(0,(v_program.duration_weeks*7)-p_starts_at_day);
 insert into public.program_deliveries(coach_id,player_id,program_template_id,revision,starts_on,starts_at_day,ends_on,sync_mode,status,snapshot)
 values((select auth.uid()),p_player_id,v_program.id,v_program.revision,p_starts_on,p_starts_at_day,v_end,p_sync_mode,case when p_starts_on<=current_date then 'active'::public.delivery_status else 'scheduled'::public.delivery_status end,v_snapshot)
 returning id into v_delivery;
 perform public.assign_program_template_to_player(p_player_id,p_program_template_id,1);
 insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,after_state) values((select auth.uid()),(select auth.uid()),'program_delivery',v_delivery,'assign',jsonb_build_object('player_id',p_player_id,'program_template_id',p_program_template_id,'revision',v_program.revision,'sync_mode',p_sync_mode));
 return v_delivery;
end $$;
revoke all on function public.create_program_delivery(uuid,uuid,date,int,public.delivery_sync_mode) from public;
grant execute on function public.create_program_delivery(uuid,uuid,date,int,public.delivery_sync_mode) to authenticated;
