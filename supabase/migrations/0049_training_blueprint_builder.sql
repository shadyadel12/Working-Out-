-- Atomic training-blueprint persistence for the accessible workout builder.
alter table public.workout_template_exercises
  add column if not exists exercise_library_id uuid references public.exercise_library(id) on delete restrict,
  add column if not exists target_seconds int check(target_seconds between 1 and 86400),
  add column if not exists load_value numeric;

create or replace function public.save_workout_blueprint(p_template_id uuid,p_name text,p_description text,p_difficulty text,p_notes text,p_items jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid:=p_template_id; v_item jsonb; v_position int:=0; v_owner uuid:=(select auth.uid());
begin
 if public.auth_role()<>'coach' or char_length(trim(p_name)) not between 1 and 200 then raise exception 'Enter a valid workout name'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Add at least one exercise or section'; end if;
 if v_id is null then
  insert into public.workout_templates(coach_id,name,description,difficulty,notes,lifecycle)
  values(v_owner,trim(p_name),nullif(trim(p_description),''),nullif(trim(p_difficulty),''),nullif(trim(p_notes),''),'draft') returning id into v_id;
 else
  update public.workout_templates set name=trim(p_name),description=nullif(trim(p_description),''),difficulty=nullif(trim(p_difficulty),''),notes=nullif(trim(p_notes),''),updated_at=now()
  where id=v_id and coach_id=v_owner and deleted_at is null;
  if not found then raise exception 'Workout not found or access denied'; end if;
  delete from public.workout_template_sections where template_id=v_id;
  delete from public.workout_template_exercises where template_id=v_id;
 end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
  if v_item->>'kind'='section' then
   if not exists(select 1 from public.workout_sections where id=(v_item->>'sourceId')::uuid and coach_id=v_owner and deleted_at is null) then raise exception 'Section not found'; end if;
   insert into public.workout_template_sections(template_id,section_id,position) values(v_id,(v_item->>'sourceId')::uuid,v_position*1000);
   insert into public.workout_template_exercises(template_id,position,name,exercise_library_id,section_id,section_name,target_sets,target_reps,target_seconds,rest_seconds,load_value,load_percent,tempo,bilateral,coach_comment,chain_key)
   select v_id,(v_position*1000)+se.position+1,e.name,e.id,se.section_id,s.name,se.sets,se.reps,se.seconds,se.rest_seconds,se.load_value,se.load_percent,se.tempo,se.bilateral,se.note,se.chain_key
   from public.workout_section_exercises se join public.exercise_library e on e.id=se.exercise_library_id join public.workout_sections s on s.id=se.section_id
   where se.section_id=(v_item->>'sourceId')::uuid order by se.position;
  elsif v_item->>'kind'='exercise' then
   if not exists(select 1 from public.exercise_library where id=(v_item->>'sourceId')::uuid and coach_id=v_owner and deleted_at is null) then raise exception 'Exercise not found'; end if;
   insert into public.workout_template_exercises(template_id,position,name,exercise_library_id,section_name,target_sets,target_reps,target_seconds,rest_seconds,load_value,load_percent,tempo,bilateral,coach_comment,chain_key)
   select v_id,v_position*1000,e.name,e.id,null,(v_item->>'sets')::int,nullif(v_item->>'reps',''),nullif(v_item->>'seconds','')::int,
    coalesce((v_item->>'restSeconds')::int,0),nullif(v_item->>'loadValue','')::numeric,nullif(v_item->>'loadPercent','')::numeric,
    nullif(v_item->>'tempo',''),coalesce((v_item->>'bilateral')::boolean,false),nullif(v_item->>'note',''),nullif(v_item->>'chainKey','')
   from public.exercise_library e where e.id=(v_item->>'sourceId')::uuid;
  else raise exception 'Unsupported workout item'; end if;
  v_position:=v_position+1;
 end loop;
 insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,after_state)
 values(v_owner,v_owner,'workout_templates',v_id,'save_blueprint',jsonb_build_object('name',trim(p_name),'items',p_items));
 return v_id;
end $$;
revoke all on function public.save_workout_blueprint(uuid,text,text,text,text,jsonb) from public;
grant execute on function public.save_workout_blueprint(uuid,text,text,text,text,jsonb) to authenticated;

create or replace function public.duplicate_workout_blueprint(p_template_id uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_source public.workout_templates; v_copy uuid; v_owner uuid:=(select auth.uid());
begin
 select * into v_source from public.workout_templates where id=p_template_id and coach_id=v_owner and deleted_at is null;
 if not found then raise exception 'Workout not found'; end if;
 insert into public.workout_templates(coach_id,name,description,difficulty,notes,lifecycle,share_mode,tags)
 values(v_owner,v_source.name||' Copy',v_source.description,v_source.difficulty,v_source.notes,'draft','private',v_source.tags) returning id into v_copy;
 insert into public.workout_template_exercises(template_id,position,name,exercise_library_id,section_name,target_sets,target_reps,target_seconds,rest_seconds,load_value,load_percent,tempo,bilateral,coach_comment,chain_key,coach_video_url,coach_video_is_external)
 select v_copy,position,name,exercise_library_id,section_name,target_sets,target_reps,target_seconds,rest_seconds,load_value,load_percent,tempo,bilateral,coach_comment,chain_key,coach_video_url,coach_video_is_external
 from public.workout_template_exercises where template_id=p_template_id order by position;
 insert into public.workout_template_sections(template_id,section_id,position) select v_copy,section_id,position from public.workout_template_sections where template_id=p_template_id order by position;
 return v_copy;
end $$;
revoke all on function public.duplicate_workout_blueprint(uuid) from public;
grant execute on function public.duplicate_workout_blueprint(uuid) to authenticated;
