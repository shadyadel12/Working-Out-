alter table public.coach_forms
  add column if not exists available_from date,
  add column if not exists available_until date,
  add constraint coach_forms_availability_order
  check (available_until is null or available_from is null or available_until >= available_from);
