alter table public.menu_templates
  add column if not exists show_dietary_info boolean not null default false;

create index if not exists menu_entries_calendar_order_idx
  on public.menu_entries(menu_template_id, week_number, day_number, position);
