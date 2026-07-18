-- Reusable coach workout library. Assignments keep only references; edits are
-- stored as overrides on the existing workout/exercise assignment rows.
create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  created_at timestamptz not null default now()
);
create unique index workout_templates_coach_name_idx on public.workout_templates (coach_id, lower(name));

create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  position int not null default 0,
  name text not null check (char_length(name) between 1 and 200),
  target_sets int,
  target_reps text,
  target_weight text,
  coach_video_url text,
  coach_video_is_external boolean not null default false,
  coach_comment text,
  created_at timestamptz not null default now()
);
create index workout_template_exercises_template_idx on public.workout_template_exercises(template_id, position);

alter table public.workouts add column template_id uuid references public.workout_templates(id) on delete restrict;
alter table public.workouts alter column name drop not null;
alter table public.workouts add constraint workouts_name_or_template check (name is not null or template_id is not null);
alter table public.exercises add column template_exercise_id uuid references public.workout_template_exercises(id) on delete restrict;
alter table public.exercises add column is_template_override boolean not null default false;
alter table public.exercises alter column name drop not null;
alter table public.exercises add constraint exercises_name_or_template check (name is not null or template_exercise_id is not null);

alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
create policy workout_templates_coach_all on public.workout_templates for all to authenticated
using (coach_id=(select auth.uid())) with check (coach_id=(select auth.uid()) and public.auth_role()='coach');
create policy workout_templates_player_read on public.workout_templates for select to authenticated using (exists (
  select 1 from workouts w join program_days d on d.id=w.program_day_id
  where w.template_id=workout_templates.id and d.player_id=(select auth.uid())
));
create policy template_exercises_coach_all on public.workout_template_exercises for all to authenticated using (exists (
  select 1 from workout_templates t where t.id=workout_template_exercises.template_id and t.coach_id=(select auth.uid())
)) with check (exists (select 1 from workout_templates t where t.id=workout_template_exercises.template_id and t.coach_id=(select auth.uid())));
create policy template_exercises_player_read on public.workout_template_exercises for select to authenticated using (exists (
  select 1 from workout_templates t join workouts w on w.template_id=t.id join program_days d on d.id=w.program_day_id
  where t.id=workout_template_exercises.template_id and d.player_id=(select auth.uid())
));

create or replace function public.save_workout_as_template(p_workout_id uuid) returns uuid
language plpgsql security invoker set search_path=public as $$
declare v_workout workouts; v_template uuid;
begin
  select w.* into v_workout from workouts w join program_days d on d.id=w.program_day_id
  where w.id=p_workout_id and d.coach_id=(select auth.uid());
  if not found then raise exception 'Workout not found or access denied'; end if;
  if v_workout.template_id is not null then return v_workout.template_id; end if;
  select id into v_template from workout_templates where coach_id=(select auth.uid()) and lower(name)=lower(v_workout.name);
  if v_template is not null then return v_template; end if;
  insert into workout_templates(coach_id,name) values ((select auth.uid()),v_workout.name) returning id into v_template;
  insert into workout_template_exercises(template_id,position,name,target_sets,target_reps,target_weight,coach_video_url,coach_video_is_external,coach_comment)
  select v_template,e.position,e.name,e.target_sets,e.target_reps,e.target_weight,e.coach_video_url,e.coach_video_is_external,e.coach_comment
  from exercises e where e.workout_id=p_workout_id order by e.position;
  return v_template;
end $$;

create or replace function public.assign_workout_template(p_program_day_id uuid,p_template_id uuid,p_position int default 0) returns uuid
language plpgsql security invoker set search_path=public as $$
declare v_workout uuid;
begin
  if not exists (select 1 from program_days d where d.id=p_program_day_id and d.coach_id=(select auth.uid()) and is_my_player(d.player_id))
     or not exists (select 1 from workout_templates t where t.id=p_template_id and t.coach_id=(select auth.uid())) then
    raise exception 'Access denied';
  end if;
  insert into workouts(program_day_id,position,name,template_id) values(p_program_day_id,p_position,null,p_template_id) returning id into v_workout;
  insert into exercises(workout_id,position,name,template_exercise_id,is_template_override,target_sets,target_reps,target_weight,coach_video_url,coach_video_is_external,coach_comment)
  select v_workout,e.position,null,e.id,false,null,null,null,null,false,null from workout_template_exercises e where e.template_id=p_template_id order by e.position;
  return v_workout;
end $$;

revoke all on function public.save_workout_as_template(uuid) from public;
revoke all on function public.assign_workout_template(uuid,uuid,int) from public;
grant execute on function public.save_workout_as_template(uuid) to authenticated;
grant execute on function public.assign_workout_template(uuid,uuid,int) to authenticated;

-- Progress resolves template values without sending duplicated assignment data.
create or replace function public.get_progress_options(p_player_id uuid) returns jsonb language sql stable security invoker set search_path=public as $$
 select jsonb_build_object('workouts',coalesce((select jsonb_agg(name order by name) from (select distinct coalesce(w.name,t.name) name from exercise_logs l join exercises e on e.id=l.exercise_id join workouts w on w.id=e.workout_id left join workout_templates t on t.id=w.template_id where l.player_id=p_player_id)q),'[]'::jsonb),'exercises',coalesce((select jsonb_agg(name order by name) from (select distinct coalesce(e.name,te.name) name from exercise_logs l join exercises e on e.id=l.exercise_id left join workout_template_exercises te on te.id=e.template_exercise_id where l.player_id=p_player_id)q),'[]'::jsonb)); $$;

create or replace function public.get_progress_page(p_player_id uuid,p_workout text default null,p_exercise text default null,p_start date default null,p_end date default null,p_limit int default 20,p_offset int default 0) returns jsonb language sql stable security invoker set search_path=public as $$
 with filtered as (select l.*,coalesce(e.name,te.name) exercise_name,coalesce(w.name,t.name) workout_name from exercise_logs l join exercises e on e.id=l.exercise_id join workouts w on w.id=e.workout_id left join workout_templates t on t.id=w.template_id left join workout_template_exercises te on te.id=e.template_exercise_id where l.player_id=p_player_id and (p_workout is null or coalesce(w.name,t.name)=p_workout) and (p_exercise is null or coalesce(e.name,te.name)=p_exercise) and (p_start is null or l.log_date>=p_start) and (p_end is null or l.log_date<=p_end)), page_rows as (select * from filtered order by log_date desc,created_at desc limit least(greatest(p_limit,1),50) offset greatest(p_offset,0)) select jsonb_build_object('total_logged',(select count(*) from filtered),'total_completed',(select count(*) from filtered where is_completed),'total_exercises',(select count(distinct exercise_name) from filtered),'rows',coalesce((select jsonb_agg(to_jsonb(page_rows) order by log_date,created_at) from page_rows),'[]'::jsonb)); $$;
