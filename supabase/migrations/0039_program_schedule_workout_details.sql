-- Details for manually-created workouts inside program templates.
alter table public.program_template_day_workouts
  add column if not exists notes text,
  add column if not exists exercise_library_ids uuid[] not null default '{}';
