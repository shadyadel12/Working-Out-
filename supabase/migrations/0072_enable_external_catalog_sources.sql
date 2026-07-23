-- Sources remain controllable by administrators; enable the approved providers
-- for the initial, rate-limited catalog seed.
update public.external_catalog_sources
set enabled=true,updated_at=now()
where provider in('wger','usda_fdc','open_food_facts');
