create or replace function public.publish_library_item(p_table text,p_id uuid) returns int
language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_allowed constant text[]:=array['exercise_library','workout_sections','workout_templates','program_templates','diet_templates','coaching_tasks','coach_forms','measurement_groups','dishes','dish_collections','menu_templates'];
 v_owner uuid;v_revision int;v_snapshot jsonb;v_entity_type text;
begin
 if not p_table=any(v_allowed) then raise exception 'Unsupported library type';end if;
 v_entity_type:=case p_table when 'exercise_library' then 'exercise' when 'workout_sections' then 'section' when 'workout_templates' then 'workout' when 'program_templates' then 'program' when 'diet_templates' then 'menu' when 'coaching_tasks' then 'task' when 'coach_forms' then 'form' when 'measurement_groups' then 'metric_group' when 'dishes' then 'dish' when 'dish_collections' then 'collection' when 'menu_templates' then 'menu' end;
 execute format('select coach_id,revision,to_jsonb(x) from public.%I x where id=$1 and deleted_at is null',p_table) into v_owner,v_revision,v_snapshot using p_id;
 if v_owner is null or v_owner<>(select auth.uid()) then raise exception 'Access denied';end if;
 v_revision:=v_revision+1;
 execute format('update public.%I set lifecycle=''published'',revision=$2,updated_at=now() where id=$1',p_table) using p_id,v_revision;
 insert into public.catalog_revisions(coach_id,entity_type,entity_id,revision,snapshot,created_by) values(v_owner,v_entity_type,p_id,v_revision,v_snapshot||jsonb_build_object('revision',v_revision,'lifecycle','published'),(select auth.uid()));
 insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,before_state,after_state) values(v_owner,(select auth.uid()),p_table,p_id,'publish',v_snapshot,v_snapshot||jsonb_build_object('revision',v_revision,'lifecycle','published'));
 return v_revision;
end $$;
revoke all on function public.publish_library_item(text,uuid) from public;
grant execute on function public.publish_library_item(text,uuid) to authenticated;
