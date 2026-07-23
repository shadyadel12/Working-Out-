alter table public.coach_foods
  add column if not exists measure text not null default 'grams',
  add column if not exists amount text not null default '';

alter table public.coach_foods
  drop constraint if exists coach_foods_measure_valid;

alter table public.coach_foods
  add constraint coach_foods_measure_valid check (measure in ('grams', 'quantity'));
