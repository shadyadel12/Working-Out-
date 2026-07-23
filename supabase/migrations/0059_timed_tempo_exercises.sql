alter table public.exercises
  add column if not exists target_seconds int check(target_seconds between 1 and 86400),
  add column if not exists tempo text;

create or replace function public.save_workout_as_template(p_workout_id uuid) returns uuid
language plpgsql security invoker set search_path=public as $$
declare v_workout workouts; v_template uuid;
begin
  select w.* into v_workout from workouts w join program_days d on d.id=w.program_day_id
  where w.id=p_workout_id and d.coach_id=(select auth.uid());
  if not found then raise exception 'Workout not found or access denied'; end if;
  if v_workout.template_id is not null then return v_workout.template_id; end if;
  select id into v_template from workout_templates where coach_id=(select auth.uid()) and lower(name)=lower(v_workout.name);
  if v_template is null then
    insert into workout_templates(coach_id,name) values ((select auth.uid()),v_workout.name) returning id into v_template;
  else
    update workout_templates set deleted_at=null,updated_at=now(),name=v_workout.name where id=v_template;
    delete from workout_template_exercises where template_id=v_template;
  end if;
  insert into workout_template_exercises(template_id,position,name,target_sets,target_reps,target_weight,target_seconds,tempo,coach_video_url,coach_video_is_external,coach_comment)
  select v_template,e.position,e.name,e.target_sets,e.target_reps,e.target_weight,e.target_seconds,e.tempo,e.coach_video_url,e.coach_video_is_external,e.coach_comment
  from exercises e where e.workout_id=p_workout_id order by e.position;
  return v_template;
end $$;

create or replace function public.assign_workout_template(p_program_day_id uuid,p_template_id uuid,p_position int default 0) returns uuid
language plpgsql security invoker set search_path=public as $$
declare v_workout uuid;
begin
  if not exists (select 1 from program_days d where d.id=p_program_day_id and d.coach_id=(select auth.uid()) and is_my_player(d.player_id))
     or not exists (select 1 from workout_templates t where t.id=p_template_id and t.coach_id=(select auth.uid())) then raise exception 'Access denied'; end if;
  insert into workouts(program_day_id,position,name,template_id) values(p_program_day_id,p_position,null,p_template_id) returning id into v_workout;
  insert into exercises(workout_id,position,name,template_exercise_id,is_template_override,target_sets,target_reps,target_weight,target_seconds,tempo,coach_video_url,coach_video_is_external,coach_comment)
  select v_workout,e.position,null,e.id,false,null,null,null,null,null,null,false,null from workout_template_exercises e where e.template_id=p_template_id order by e.position;
  return v_workout;
end $$;
