-- 0012: weight tracking.
-- Coach sets a target weight per exercise; player logs the actual weight used.
alter table public.exercises
  add column if not exists target_weight text;   -- free text: "60kg", "bodyweight"

alter table public.exercise_logs
  add column if not exists actual_weight text;
