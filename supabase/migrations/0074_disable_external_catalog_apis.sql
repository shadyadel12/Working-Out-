-- External catalog APIs are no longer used. Keep their source and sync history
-- for attribution and audit purposes, but prevent any further synchronization.

update public.external_catalog_sources
set enabled = false,
    last_status = 'disabled',
    updated_at = now()
where provider in ('wger', 'usda_fdc', 'open_food_facts');
