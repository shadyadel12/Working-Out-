alter table public.scheduled_coaching_items
  drop constraint if exists scheduled_coaching_items_item_type_check;

alter table public.scheduled_coaching_items
  add constraint scheduled_coaching_items_item_type_check
  check (item_type in ('task','form','metric_group','meal_plan','recipe_book'));

alter table public.scheduled_coaching_items
  add column if not exists snapshot jsonb not null default '{}'::jsonb;

create or replace function public.complete_coaching_assignment(p_assignment_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.scheduled_coaching_items
  set status='complete', completed_at=now()
  where id=p_assignment_id and player_id=(select auth.uid()) and status in ('scheduled','active');
  if not found then raise exception 'Assignment not found or cannot be completed'; end if;
end $$;

revoke all on function public.complete_coaching_assignment(uuid) from public;
grant execute on function public.complete_coaching_assignment(uuid) to authenticated;
