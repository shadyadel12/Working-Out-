-- Atomic full-plan replacements. A PostgreSQL function call is one statement
-- transaction: any validation/insert error rolls the preceding delete back.

create or replace function public.replace_program_import(
  p_player_id uuid,
  p_days jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid := auth.uid();
  v_day jsonb;
  v_workout jsonb;
  v_exercise jsonb;
  v_day_id uuid;
  v_workout_id uuid;
  v_days int := 0;
  v_workouts int := 0;
  v_exercises int := 0;
  v_position int;
  v_exercise_position int;
begin
  if public.auth_role() <> 'coach' or not public.is_my_player(p_player_id) then
    raise exception 'Access denied';
  end if;
  if jsonb_typeof(p_days) <> 'array' or jsonb_array_length(p_days) = 0
     or jsonb_array_length(p_days) > 3640 then
    raise exception 'Invalid program import';
  end if;

  -- Validate the complete payload before deleting existing data.
  for v_day in select value from jsonb_array_elements(p_days) loop
    if coalesce((v_day->>'week')::int, 0) not between 1 and 520
       or coalesce((v_day->>'dow')::int, -1) not between 0 and 6
       or coalesce(v_day->>'day_type', '') not in ('training', 'rest')
       or jsonb_typeof(coalesce(v_day->'workouts', '[]'::jsonb)) <> 'array' then
      raise exception 'Invalid program day';
    end if;
    if jsonb_array_length(coalesce(v_day->'workouts', '[]'::jsonb)) > 50 then
      raise exception 'Too many workouts in one day';
    end if;
    for v_workout in select value from jsonb_array_elements(coalesce(v_day->'workouts', '[]'::jsonb)) loop
      if char_length(trim(coalesce(v_workout->>'name', ''))) not between 1 and 200
         or jsonb_typeof(coalesce(v_workout->'exercises', '[]'::jsonb)) <> 'array'
         or jsonb_array_length(coalesce(v_workout->'exercises', '[]'::jsonb)) > 200 then
        raise exception 'Invalid workout';
      end if;
      for v_exercise in select value from jsonb_array_elements(coalesce(v_workout->'exercises', '[]'::jsonb)) loop
        if char_length(trim(coalesce(v_exercise->>'name', ''))) not between 1 and 200 then
          raise exception 'Invalid exercise';
        end if;
      end loop;
    end loop;
  end loop;

  delete from public.program_days where player_id = p_player_id;

  for v_day in select value from jsonb_array_elements(p_days) loop
    insert into public.program_days
      (player_id, coach_id, week_number, day_of_week, day_type, title, diet_plan)
    values (
      p_player_id, v_coach_id, (v_day->>'week')::int, (v_day->>'dow')::int,
      (v_day->>'day_type')::public.day_type, null, nullif(v_day->>'diet_plan', '')
    ) returning id into v_day_id;
    v_days := v_days + 1;
    v_position := 0;
    for v_workout in select value from jsonb_array_elements(coalesce(v_day->'workouts', '[]'::jsonb)) loop
      insert into public.workouts (program_day_id, position, name)
      values (v_day_id, v_position, trim(v_workout->>'name'))
      returning id into v_workout_id;
      v_workouts := v_workouts + 1;
      v_position := v_position + 1;
      v_exercise_position := 0;

      for v_exercise in
        select value from jsonb_array_elements(coalesce(v_workout->'exercises', '[]'::jsonb))
      loop
        insert into public.exercises (
          workout_id, position, name, target_sets, target_reps, target_weight,
          coach_comment, coach_video_url, coach_video_is_external
        ) values (
          v_workout_id, v_exercise_position, trim(v_exercise->>'name'),
          nullif(v_exercise->>'target_sets', '')::int,
          nullif(v_exercise->>'target_reps', ''), nullif(v_exercise->>'target_weight', ''),
          nullif(v_exercise->>'coach_comment', ''), nullif(v_exercise->>'coach_video_url', ''),
          coalesce((v_exercise->>'coach_video_is_external')::boolean, false)
        );
        v_exercises := v_exercises + 1;
        v_exercise_position := v_exercise_position + 1;
      end loop;
    end loop;
  end loop;

  return jsonb_build_object(
    'daysCreated', v_days,
    'workoutsCreated', v_workouts,
    'exercisesCreated', v_exercises
  );
end;
$$;
revoke all on function public.replace_program_import(uuid, jsonb) from public;
grant execute on function public.replace_program_import(uuid, jsonb) to authenticated;

create or replace function public.replace_diet_import(
  p_player_id uuid,
  p_days jsonb,
  p_foods jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid := auth.uid();
  v_day jsonb;
  v_food jsonb;
  v_days int := 0;
  v_meals int := 0;
  v_foods int := 0;
begin
  if public.auth_role() <> 'coach' or not public.is_my_player(p_player_id) then
    raise exception 'Access denied';
  end if;
  if jsonb_typeof(p_days) <> 'array' or jsonb_array_length(p_days) = 0
     or jsonb_array_length(p_days) > 3640
     or jsonb_typeof(p_foods) <> 'array' or jsonb_array_length(p_foods) > 5000 then
    raise exception 'Invalid diet import';
  end if;

  for v_day in select value from jsonb_array_elements(p_days) loop
    if coalesce((v_day->>'week')::int, 0) not between 1 and 520
       or coalesce((v_day->>'dow')::int, -1) not between 0 and 6
       or jsonb_typeof(v_day->'meals') <> 'array'
       or jsonb_array_length(v_day->'meals') > 20
       or octet_length((v_day->'meals')::text) > 1048576 then
      raise exception 'Invalid diet day';
    end if;
    v_meals := v_meals + jsonb_array_length(v_day->'meals');
  end loop;

  delete from public.diet_days where player_id = p_player_id;
  for v_day in select value from jsonb_array_elements(p_days) loop
    insert into public.diet_days
      (player_id, coach_id, week_number, day_of_week, meals, comment, updated_at)
    values (
      p_player_id, v_coach_id, (v_day->>'week')::int, (v_day->>'dow')::int,
      v_day->'meals', nullif(v_day->>'comment', ''), now()
    );
    v_days := v_days + 1;
  end loop;

  for v_food in select value from jsonb_array_elements(p_foods) loop
    if char_length(trim(v_food #>> '{}')) not between 1 and 200 then
      raise exception 'Invalid food name';
    end if;
    insert into public.coach_foods (coach_id, name)
    values (v_coach_id, trim(v_food #>> '{}'))
    on conflict (coach_id, name) do nothing;
    v_foods := v_foods + 1;
  end loop;

  return jsonb_build_object(
    'daysCreated', v_days,
    'mealsCreated', v_meals,
    'foodsCreated', v_foods
  );
end;
$$;
revoke all on function public.replace_diet_import(uuid, jsonb, jsonb) from public;
grant execute on function public.replace_diet_import(uuid, jsonb, jsonb) to authenticated;
