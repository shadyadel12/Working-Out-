-- Remove the previously seeded USDA and Open Food Facts catalog from library
-- discovery while retaining rows for any existing recipe references.

do $$
declare
  v_imported_count integer;
begin
  select count(*)
  into v_imported_count
  from public.food_items
  where source_provider in ('usda_fdc', 'open_food_facts')
    and external_id is not null
    and deleted_at is null;

  if v_imported_count <> 99 then
    raise exception 'Expected 99 active imported ingredients, found %', v_imported_count;
  end if;

  update public.food_items
  set deleted_at = now(),
      updated_at = now(),
      visibility = 'private',
      lifecycle = 'archived',
      moderation_status = 'removed',
      moderation_reason = 'External catalog integration removed',
      sync_status = 'disabled'
  where source_provider in ('usda_fdc', 'open_food_facts')
    and external_id is not null
    and deleted_at is null;
end
$$;
