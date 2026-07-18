-- Return only the requested progress page. RLS remains active because these
-- are security-invoker functions.
create or replace function public.get_progress_options(p_player_id uuid)
returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'workouts', coalesce((select jsonb_agg(name order by name) from (select distinct w.name from exercise_logs l join exercises e on e.id=l.exercise_id join workouts w on w.id=e.workout_id where l.player_id=p_player_id) q), '[]'::jsonb),
    'exercises', coalesce((select jsonb_agg(name order by name) from (select distinct e.name from exercise_logs l join exercises e on e.id=l.exercise_id where l.player_id=p_player_id) q), '[]'::jsonb)
  );
$$;

create or replace function public.get_progress_page(
  p_player_id uuid, p_workout text default null, p_exercise text default null,
  p_start date default null, p_end date default null,
  p_limit int default 20, p_offset int default 0
) returns jsonb language sql stable security invoker set search_path = public as $$
  with filtered as (
    select l.*, e.name exercise_name, w.name workout_name
    from exercise_logs l join exercises e on e.id=l.exercise_id join workouts w on w.id=e.workout_id
    where l.player_id=p_player_id
      and (p_workout is null or w.name=p_workout)
      and (p_exercise is null or e.name=p_exercise)
      and (p_start is null or l.log_date>=p_start)
      and (p_end is null or l.log_date<=p_end)
  ), page_rows as (
    select * from filtered order by log_date desc, created_at desc
    limit least(greatest(p_limit,1),50) offset greatest(p_offset,0)
  )
  select jsonb_build_object(
    'total_logged', (select count(*) from filtered),
    'total_completed', (select count(*) from filtered where is_completed),
    'total_exercises', (select count(distinct exercise_name) from filtered),
    'rows', coalesce((select jsonb_agg(to_jsonb(page_rows) order by log_date, created_at) from page_rows), '[]'::jsonb)
  );
$$;

revoke all on function public.get_progress_options(uuid) from public;
revoke all on function public.get_progress_page(uuid,text,text,date,date,int,int) from public;
grant execute on function public.get_progress_options(uuid) to authenticated;
grant execute on function public.get_progress_page(uuid,text,text,date,date,int,int) to authenticated;
