-- Add optional coach comment field to diet_days.
alter table public.diet_days
  add column if not exists comment text;
