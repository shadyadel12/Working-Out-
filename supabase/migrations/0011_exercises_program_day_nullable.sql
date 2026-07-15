-- 0011: exercises.program_day_id is now legacy (workout_id is the parent).
-- New exercises only set workout_id, so drop the NOT NULL constraint.
alter table public.exercises
  alter column program_day_id drop not null;
