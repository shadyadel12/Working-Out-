-- Assign a complete reusable program to a linked player.
create or replace function public.assign_program_template_to_player(p_player_id uuid,p_program_template_id uuid,p_start_week int) returns int
language plpgsql security invoker set search_path=public as $$
declare v_program program_templates; v_day record; v_source_workout record; v_day_id uuid; v_workout_id uuid; v_dow int; v_target_week int; v_exercise_id uuid; v_position int;
begin
  if p_start_week < 1 or not public.is_my_player(p_player_id) then raise exception 'Access denied or invalid starting week'; end if;
  select * into v_program from program_templates where id=p_program_template_id and coach_id=(select auth.uid());
  if not found then raise exception 'Program template not found'; end if;
  delete from program_days where player_id=p_player_id and week_number between p_start_week and p_start_week+v_program.duration_weeks-1;
  for v_day in select * from program_template_days where program_template_id=v_program.id order by week_number,day_number loop
    v_target_week:=p_start_week+v_day.week_number-1;
    v_dow:=case when v_day.day_number=1 then 6 else v_day.day_number-2 end;
    insert into program_days(player_id,coach_id,week_number,day_of_week,day_type,title,diet_plan) values(p_player_id,(select auth.uid()),v_target_week,v_dow,'training',null,null) returning id into v_day_id;
    for v_source_workout in select * from program_template_day_workouts where program_template_day_id=v_day.id order by position loop
      insert into workouts(program_day_id,position,name,template_id) values(v_day_id,v_source_workout.position,v_source_workout.name,v_source_workout.workout_template_id) returning id into v_workout_id;
      if v_source_workout.workout_template_id is not null then
        insert into exercises(workout_id,position,name,template_exercise_id,is_template_override,target_sets,target_reps,target_weight,coach_video_url,coach_video_is_external,coach_comment)
        select v_workout_id,e.position,null,e.id,false,null,null,null,null,false,null from workout_template_exercises e where e.template_id=v_source_workout.workout_template_id order by e.position;
      else
        v_position:=0;
        foreach v_exercise_id in array v_source_workout.exercise_library_ids loop
          insert into exercises(workout_id,position,name,target_sets,target_reps,target_weight,coach_video_url,coach_video_is_external,coach_comment,is_template_override)
          select v_workout_id,v_position,l.name,null,null,null,l.video_url,(l.video_url is not null),coalesce(l.default_note,l.instructions),true from exercise_library l where l.id=v_exercise_id and l.coach_id=(select auth.uid());
          v_position:=v_position+1;
        end loop;
      end if;
    end loop;
  end loop;
  return v_program.duration_weeks;
end $$;
revoke all on function public.assign_program_template_to_player(uuid,uuid,int) from public;
grant execute on function public.assign_program_template_to_player(uuid,uuid,int) to authenticated;
