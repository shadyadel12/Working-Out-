-- Additional reusable exercise details.
alter table public.exercise_library
  add column if not exists equipment text,
  add column if not exists instructions text,
  add column if not exists default_note text,
  add column if not exists tracking_fields text[] not null default '{}',
  add column if not exists video_url text;

alter table public.exercise_library drop constraint if exists exercise_library_tracking_fields_limit;
alter table public.exercise_library add constraint exercise_library_tracking_fields_limit
  check (cardinality(tracking_fields) <= 3);
