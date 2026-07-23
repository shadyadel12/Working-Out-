-- Private/public coach catalogs, moderation, reporting and external source tracking.
-- Existing records remain private. Public items are immediately discoverable.

create type public.catalog_visibility as enum ('private','public');
create type public.catalog_moderation_status as enum ('visible','hidden','removed');
create type public.catalog_report_status as enum ('open','reviewing','resolved','dismissed');
create type public.catalog_sync_status as enum ('never','running','ok','failed','quarantined','disabled');

alter table public.catalog_revisions drop constraint if exists catalog_revisions_entity_type_check;
alter table public.catalog_revisions add constraint catalog_revisions_entity_type_check
  check(entity_type in('exercise','ingredient','section','workout','program','task','form','menu','dish','collection','metric_group'));

-- Ingredients predate the common lifecycle columns, so add them before the
-- shared index/policy setup below.
alter table public.food_items
  add column lifecycle public.catalog_lifecycle not null default 'published',
  add column share_mode public.catalog_share_mode not null default 'private',
  add column revision int not null default 1 check(revision>0);
alter table public.workout_templates
  add column if not exists updated_at timestamptz not null default now();

do $$ declare v_table text; begin
  foreach v_table in array array['exercise_library','workout_templates','food_items','dishes','menu_templates'] loop
    execute format('alter table public.%I add column visibility public.catalog_visibility not null default ''private''',v_table);
    execute format('alter table public.%I add column creator_name text',v_table);
    execute format('alter table public.%I add column source_provider text',v_table);
    execute format('alter table public.%I add column external_id text',v_table);
    execute format('alter table public.%I add column source_url text',v_table);
    execute format('alter table public.%I add column source_license text',v_table);
    execute format('alter table public.%I add column source_attribution text',v_table);
    execute format('alter table public.%I add column imported_at timestamptz',v_table);
    execute format('alter table public.%I add column last_synced_at timestamptz',v_table);
    execute format('alter table public.%I add column content_hash text',v_table);
    execute format('alter table public.%I add column sync_status public.catalog_sync_status not null default ''never''',v_table);
    execute format('alter table public.%I add column moderation_status public.catalog_moderation_status not null default ''visible''',v_table);
    execute format('alter table public.%I add column moderated_at timestamptz',v_table);
    execute format('alter table public.%I add column moderated_by uuid references public.profiles(id)',v_table);
    execute format('alter table public.%I add column moderation_reason text',v_table);
    execute format('alter table public.%I add column copied_from_id uuid',v_table);
    execute format('alter table public.%I add column copied_from_revision int',v_table);
    execute format('update public.%I x set creator_name=coalesce(nullif(trim(p.name),''''),p.email) from public.profiles p where p.id=x.coach_id and x.creator_name is null',v_table);
    execute format('create index %I on public.%I(visibility,lifecycle,updated_at desc) where deleted_at is null',v_table||'_public_discovery_idx',v_table);
    execute format('create unique index %I on public.%I(source_provider,external_id) where source_provider is not null and external_id is not null',v_table||'_provider_external_uidx',v_table);
    execute format('create index %I on public.%I(content_hash) where content_hash is not null',v_table||'_content_hash_idx',v_table);
  end loop;
end $$;

alter table public.food_items
  add column micronutrients jsonb not null default '{}'::jsonb,
  add column serving_size numeric,
  add column serving_unit text;
alter table public.exercise_library add column image_url text;
drop policy if exists exercise_library_admin_all on public.exercise_library;

create table public.catalog_item_reports(
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  owner_id uuid not null references public.profiles(id),
  entity_type text not null check(entity_type in('exercise_library','workout_templates','food_items','dishes','menu_templates')),
  entity_id uuid not null,
  reason text not null check(char_length(trim(reason)) between 3 and 1000),
  status public.catalog_report_status not null default 'open',
  reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, resolution_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(reporter_id,entity_type,entity_id,status)
);

create table public.external_catalog_sources(
  provider text primary key check(provider in('wger','usda_fdc','open_food_facts')),
  display_name text not null, enabled boolean not null default false,
  base_url text not null, license_name text not null, attribution text not null,
  requests_per_minute int not null default 30 check(requests_per_minute between 1 and 1000),
  last_sync_at timestamptz, last_status public.catalog_sync_status not null default 'never',
  updated_by uuid references public.profiles(id), updated_at timestamptz not null default now()
);
insert into public.external_catalog_sources(provider,display_name,base_url,license_name,attribution,requests_per_minute) values
 ('wger','wger','https://wger.de/api/v2','See the license on each source record','Exercise data provided by wger',20),
 ('usda_fdc','USDA FoodData Central','https://api.nal.usda.gov/fdc/v1','Public domain / provider terms','Data from USDA FoodData Central',60),
 ('open_food_facts','Open Food Facts','https://world.openfoodfacts.org/api/v2','ODbL; product images may have separate licenses','Data from Open Food Facts',20);

create table public.external_catalog_sync_runs(
  id uuid primary key default gen_random_uuid(), provider text not null references public.external_catalog_sources(provider),
  requested_by uuid references public.profiles(id), status public.catalog_sync_status not null default 'running',
  attempt int not null default 1, requested_count int not null default 0, imported_count int not null default 0,
  updated_count int not null default 0, skipped_count int not null default 0, quarantined_count int not null default 0,
  error_message text, started_at timestamptz not null default now(), finished_at timestamptz
);
create table public.external_catalog_quarantine(
  id uuid primary key default gen_random_uuid(), provider text not null references public.external_catalog_sources(provider),
  external_id text, entity_type text not null, reason text not null, payload jsonb not null,
  content_hash text, sync_run_id uuid references public.external_catalog_sync_runs(id) on delete set null,
  resolved_at timestamptz, resolved_by uuid references public.profiles(id), created_at timestamptz not null default now()
);

alter table public.catalog_item_reports enable row level security;
alter table public.external_catalog_sources enable row level security;
alter table public.external_catalog_sync_runs enable row level security;
alter table public.external_catalog_quarantine enable row level security;
create policy catalog_reports_reporter_insert on public.catalog_item_reports for insert to authenticated
  with check(reporter_id=(select auth.uid()) and public.auth_role()='coach');
create policy catalog_reports_reporter_read on public.catalog_item_reports for select to authenticated
  using(reporter_id=(select auth.uid()));
create policy catalog_reports_admin_all on public.catalog_item_reports for all to authenticated
  using(public.auth_role()='admin') with check(public.auth_role()='admin');
create policy external_sources_coach_read on public.external_catalog_sources for select to authenticated using(public.auth_role() in ('coach','admin'));
create policy external_sources_admin_write on public.external_catalog_sources for all to authenticated using(public.auth_role()='admin') with check(public.auth_role()='admin');
create policy external_runs_admin_all on public.external_catalog_sync_runs for all to authenticated using(public.auth_role()='admin') with check(public.auth_role()='admin');
create policy external_quarantine_admin_all on public.external_catalog_quarantine for all to authenticated using(public.auth_role()='admin') with check(public.auth_role()='admin');
create policy library_audit_admin_read on public.library_audit_events for select to authenticated using(public.auth_role()='admin');

-- Public discovery is global for coaches, but only while the item remains published and visible.
do $$ declare v_table text; begin
  foreach v_table in array array['exercise_library','workout_templates','food_items','dishes','menu_templates'] loop
    execute format('create policy %I on public.%I for select to authenticated using(public.auth_role() in (''coach'',''admin'') and visibility=''public'' and lifecycle=''published'' and moderation_status=''visible'' and deleted_at is null)',v_table||'_public_read',v_table);
    execute format('create policy %I on public.%I for select to authenticated using(public.auth_role()=''admin'')',v_table||'_moderator_read',v_table);
  end loop;
end $$;
create policy workout_template_exercises_public_read on public.workout_template_exercises for select to authenticated using(exists(select 1 from public.workout_templates t where t.id=template_id and t.visibility='public' and t.lifecycle='published' and t.moderation_status='visible' and t.deleted_at is null));
create policy dish_components_public_read on public.dish_components for select to authenticated using(exists(select 1 from public.dishes d where d.id=dish_id and d.visibility='public' and d.lifecycle='published' and d.moderation_status='visible' and d.deleted_at is null));
create policy menu_entries_public_read on public.menu_entries for select to authenticated using(exists(select 1 from public.menu_templates m where m.id=menu_template_id and m.visibility='public' and m.lifecycle='published' and m.moderation_status='visible' and m.deleted_at is null));
create policy food_items_public_recipe_read on public.food_items for select to authenticated using(exists(select 1 from public.dish_components c join public.dishes d on d.id=c.dish_id where c.food_item_id=food_items.id and d.visibility='public' and d.lifecycle='published' and d.moderation_status='visible' and d.deleted_at is null));

create or replace function public.catalog_entity_type(p_table text) returns text language sql immutable as $$
 select case p_table when 'exercise_library' then 'exercise' when 'workout_templates' then 'workout' when 'food_items' then 'ingredient' when 'dishes' then 'dish' when 'menu_templates' then 'menu' end
$$;

create or replace function public.bump_public_catalog_revision() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if old.visibility='public' and (select auth.uid())=old.coach_id and
    (to_jsonb(new)-array['revision','updated_at','moderation_status','moderated_at','moderated_by','moderation_reason']) is distinct from
    (to_jsonb(old)-array['revision','updated_at','moderation_status','moderated_at','moderated_by','moderation_reason']) then
    new.revision:=old.revision+1;
  end if;
  return new;
end $$;
create or replace function public.snapshot_public_catalog_revision() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.revision>old.revision then
    insert into public.catalog_revisions(coach_id,entity_type,entity_id,revision,snapshot,created_by)
    values(new.coach_id,public.catalog_entity_type(tg_table_name),new.id,new.revision,to_jsonb(new),coalesce((select auth.uid()),new.coach_id))
    on conflict(entity_type,entity_id,revision) do nothing;
  end if;
  return new;
end $$;
do $$ declare v_table text; begin
  foreach v_table in array array['exercise_library','workout_templates','food_items','dishes','menu_templates'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.bump_public_catalog_revision()',v_table||'_public_revision_bump',v_table);
    execute format('create trigger %I after update on public.%I for each row execute function public.snapshot_public_catalog_revision()',v_table||'_public_revision_snapshot',v_table);
  end loop;
end $$;

create or replace function public.report_catalog_item(p_table text,p_id uuid,p_reason text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner uuid;v_report uuid;
begin
 if not p_table=any(array['exercise_library','workout_templates','food_items','dishes','menu_templates']) then raise exception 'Unsupported library type';end if;
 if public.auth_role()<>'coach' or char_length(trim(p_reason))<3 then raise exception 'Invalid report';end if;
 execute format('select coach_id from public.%I where id=$1 and visibility=''public'' and lifecycle=''published'' and moderation_status=''visible'' and deleted_at is null',p_table) into v_owner using p_id;
 if v_owner is null then raise exception 'Public item not found';end if;
 insert into public.catalog_item_reports(reporter_id,owner_id,entity_type,entity_id,reason) values((select auth.uid()),v_owner,p_table,p_id,trim(p_reason)) returning id into v_report;
 insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,after_state) values(v_owner,(select auth.uid()),p_table,p_id,'report',jsonb_build_object('report_id',v_report,'reason',trim(p_reason)));
 return v_report;
end $$;
revoke all on function public.report_catalog_item(text,uuid,text) from public; grant execute on function public.report_catalog_item(text,uuid,text) to authenticated;

create or replace function public.moderate_catalog_item(p_table text,p_id uuid,p_status public.catalog_moderation_status,p_reason text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner uuid;v_before jsonb;v_after jsonb;
begin
 if public.auth_role()<>'admin' then raise exception 'Access denied';end if;
 if not p_table=any(array['exercise_library','workout_templates','food_items','dishes','menu_templates']) then raise exception 'Unsupported library type';end if;
 execute format('select coach_id,to_jsonb(x) from public.%I x where id=$1',p_table) into v_owner,v_before using p_id;
 if v_owner is null then raise exception 'Item not found';end if;
 execute format('update public.%I set moderation_status=$2,moderated_at=now(),moderated_by=$3,moderation_reason=$4,updated_at=now() where id=$1',p_table) using p_id,p_status,(select auth.uid()),nullif(trim(p_reason),'');
 execute format('select to_jsonb(x) from public.%I x where id=$1',p_table) into v_after using p_id;
 update public.catalog_item_reports set status=case when p_status='visible' then 'dismissed'::public.catalog_report_status else 'resolved'::public.catalog_report_status end,reviewed_by=(select auth.uid()),reviewed_at=now(),resolution_note=nullif(trim(p_reason),''),updated_at=now() where entity_type=p_table and entity_id=p_id and status in('open','reviewing');
 insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,before_state,after_state) values(v_owner,(select auth.uid()),p_table,p_id,case when p_status='visible' then 'moderation_restore' else 'moderation_'||p_status::text end,v_before,v_after);
end $$;
revoke all on function public.moderate_catalog_item(text,uuid,public.catalog_moderation_status,text) from public; grant execute on function public.moderate_catalog_item(text,uuid,public.catalog_moderation_status,text) to authenticated;

create or replace function public.clone_catalog_exercise(p_source uuid,p_owner uuid) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_new uuid:=gen_random_uuid();v_source jsonb;v_name text;v_actor text;
begin select to_jsonb(x),x.name into v_source,v_name from public.exercise_library x where id=p_source;select coalesce(nullif(trim(name),''),email) into v_actor from public.profiles where id=p_owner;
 if v_source is null then return null;end if;
 insert into public.exercise_library select(jsonb_populate_record(null::public.exercise_library,v_source||jsonb_build_object('id',v_new,'coach_id',p_owner,'name',left(v_name||' Copy '||left(v_new::text,6),200),'creator_name',v_actor,'external_id',null,'visibility','private','lifecycle','draft','revision',1,'copied_from_id',p_source,'copied_from_revision',coalesce((v_source->>'revision')::int,1),'deleted_at',null,'created_at',now(),'updated_at',now()))).*;return v_new;
end $$;
create or replace function public.clone_catalog_food(p_source uuid,p_owner uuid) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_new uuid:=gen_random_uuid();v_source jsonb;v_name text;v_actor text;
begin select to_jsonb(x),x.name into v_source,v_name from public.food_items x where id=p_source;select coalesce(nullif(trim(name),''),email) into v_actor from public.profiles where id=p_owner;
 if v_source is null then return null;end if;
 insert into public.food_items select(jsonb_populate_record(null::public.food_items,v_source||jsonb_build_object('id',v_new,'coach_id',p_owner,'name',left(v_name||' Copy '||left(v_new::text,6),200),'creator_name',v_actor,'external_id',null,'visibility','private','lifecycle','draft','revision',1,'copied_from_id',p_source,'copied_from_revision',coalesce((v_source->>'revision')::int,1),'deleted_at',null,'created_at',now(),'updated_at',now()))).*;return v_new;
end $$;
create or replace function public.clone_catalog_dish(p_source uuid,p_owner uuid) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_new uuid:=gen_random_uuid();v_source jsonb;v_title text;v_actor text;v_component record;v_food uuid;
begin select to_jsonb(x),x.title into v_source,v_title from public.dishes x where id=p_source;select coalesce(nullif(trim(name),''),email) into v_actor from public.profiles where id=p_owner;
 if v_source is null then return null;end if;
 insert into public.dishes select(jsonb_populate_record(null::public.dishes,v_source||jsonb_build_object('id',v_new,'coach_id',p_owner,'title',left(v_title||' Copy '||left(v_new::text,6),200),'creator_name',v_actor,'external_id',null,'visibility','private','lifecycle','draft','revision',1,'copied_from_id',p_source,'copied_from_revision',coalesce((v_source->>'revision')::int,1),'deleted_at',null,'created_at',now(),'updated_at',now()))).*;
 for v_component in select * from public.dish_components where dish_id=p_source order by position loop v_food:=public.clone_catalog_food(v_component.food_item_id,p_owner);insert into public.dish_components(dish_id,food_item_id,quantity,unit,position)values(v_new,v_food,v_component.quantity,v_component.unit,v_component.position);end loop;return v_new;
end $$;
revoke all on function public.clone_catalog_exercise(uuid,uuid) from public;revoke all on function public.clone_catalog_food(uuid,uuid) from public;revoke all on function public.clone_catalog_dish(uuid,uuid) from public;

create or replace function public.copy_public_catalog_item(p_table text,p_id uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_new uuid:=gen_random_uuid();v_source jsonb;v_owner uuid;v_revision int;v_title text;v_actor_name text;v_child record;v_child_id uuid;
begin
 if public.auth_role()<>'coach' then raise exception 'Access denied';end if;
 if not p_table=any(array['exercise_library','workout_templates','food_items','dishes','menu_templates']) then raise exception 'Unsupported library type';end if;
 execute format('select to_jsonb(x),coach_id,revision,coalesce(to_jsonb(x)->>''name'',to_jsonb(x)->>''title'') from public.%I x where id=$1 and visibility=''public'' and lifecycle=''published'' and moderation_status=''visible'' and deleted_at is null',p_table) into v_source,v_owner,v_revision,v_title using p_id;
 if v_source is null then raise exception 'Public item not found';end if;
 select coalesce(nullif(trim(name),''),email) into v_actor_name from public.profiles where id=(select auth.uid());
 if p_table='exercise_library' then
   v_new:=public.clone_catalog_exercise(p_id,(select auth.uid()));
 elsif p_table='workout_templates' then
   insert into public.workout_templates select (jsonb_populate_record(null::public.workout_templates,v_source||jsonb_build_object('id',v_new,'coach_id',(select auth.uid()),'name',left(v_title||' Copy '||left(v_new::text,6),200),'creator_name',v_actor_name,'external_id',null,'visibility','private','lifecycle','draft','revision',1,'copied_from_id',p_id,'copied_from_revision',v_revision,'deleted_at',null,'created_at',now(),'updated_at',now()))).*;
   for v_child in select * from public.workout_template_exercises where template_id=p_id order by position loop v_child_id:=case when v_child.exercise_library_id is null then null else public.clone_catalog_exercise(v_child.exercise_library_id,(select auth.uid())) end;insert into public.workout_template_exercises(template_id,position,name,exercise_library_id,section_name,target_sets,target_reps,target_weight,target_seconds,rest_seconds,load_value,load_percent,tempo,bilateral,coach_comment,chain_key,coach_video_url,coach_video_is_external)values(v_new,v_child.position,v_child.name,v_child_id,v_child.section_name,v_child.target_sets,v_child.target_reps,v_child.target_weight,v_child.target_seconds,v_child.rest_seconds,v_child.load_value,v_child.load_percent,v_child.tempo,v_child.bilateral,v_child.coach_comment,v_child.chain_key,v_child.coach_video_url,v_child.coach_video_is_external);end loop;
 elsif p_table='food_items' then
   v_new:=public.clone_catalog_food(p_id,(select auth.uid()));
 elsif p_table='dishes' then
   v_new:=public.clone_catalog_dish(p_id,(select auth.uid()));
 else
   insert into public.menu_templates select (jsonb_populate_record(null::public.menu_templates,v_source||jsonb_build_object('id',v_new,'coach_id',(select auth.uid()),'title',left(v_title||' Copy '||left(v_new::text,6),90),'creator_name',v_actor_name,'external_id',null,'visibility','private','lifecycle','draft','revision',1,'copied_from_id',p_id,'copied_from_revision',v_revision,'deleted_at',null,'created_at',now(),'updated_at',now()))).*;
   for v_child in select * from public.menu_entries where menu_template_id=p_id order by week_number,day_number,position loop v_child_id:=case when v_child.dish_id is null then null else public.clone_catalog_dish(v_child.dish_id,(select auth.uid())) end;insert into public.menu_entries(menu_template_id,week_number,day_number,meal_name,dish_id,note,position,meal_type)values(v_new,v_child.week_number,v_child.day_number,v_child.meal_name,v_child_id,v_child.note,v_child.position,v_child.meal_type);end loop;
 end if;
 insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,after_state) values((select auth.uid()),(select auth.uid()),p_table,v_new,'copy',jsonb_build_object('source_owner_id',v_owner,'source_id',p_id,'source_revision',v_revision));
 return v_new;
end $$;
revoke all on function public.copy_public_catalog_item(text,uuid) from public; grant execute on function public.copy_public_catalog_item(text,uuid) to authenticated;

-- Ingredients now participate in the existing publish/soft-delete lifecycle.
create or replace function public.publish_catalog_item(p_table text,p_id uuid,p_visibility public.catalog_visibility) returns int
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner uuid;v_revision int;v_snapshot jsonb;v_name text;
begin
 if not p_table=any(array['exercise_library','workout_templates','food_items','dishes','menu_templates']) then raise exception 'Unsupported library type';end if;
 execute format('select coach_id,revision,to_jsonb(x) from public.%I x where id=$1 and deleted_at is null',p_table) into v_owner,v_revision,v_snapshot using p_id;
 if v_owner is null or v_owner<>(select auth.uid()) then raise exception 'Access denied';end if;
 select coalesce(nullif(trim(name),''),email) into v_name from public.profiles where id=v_owner;
 v_revision:=v_revision+1;
 execute format('update public.%I set lifecycle=''published'',visibility=$2,creator_name=coalesce(creator_name,$3),revision=$4,updated_at=now() where id=$1',p_table) using p_id,p_visibility,v_name,v_revision;
 insert into public.catalog_revisions(coach_id,entity_type,entity_id,revision,snapshot,created_by) values(v_owner,public.catalog_entity_type(p_table),p_id,v_revision,v_snapshot||jsonb_build_object('revision',v_revision,'lifecycle','published','visibility',p_visibility),(select auth.uid())) on conflict do nothing;
 insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,before_state,after_state) values(v_owner,(select auth.uid()),p_table,p_id,case when p_visibility='public' then 'publish_public' else 'publish_private' end,v_snapshot,v_snapshot||jsonb_build_object('revision',v_revision,'lifecycle','published','visibility',p_visibility));
 return v_revision;
end $$;
revoke all on function public.publish_catalog_item(text,uuid,public.catalog_visibility) from public; grant execute on function public.publish_catalog_item(text,uuid,public.catalog_visibility) to authenticated;

-- Freeze legacy linked workout assignments at their current values. New assignments
-- also store their own values, so later template revisions cannot change a player plan.
update public.workouts w set name=t.name
from public.workout_templates t where w.template_id=t.id and w.name is null;
update public.exercises e set
 name=coalesce(e.name,te.name), target_sets=coalesce(e.target_sets,te.target_sets),
 target_reps=coalesce(e.target_reps,te.target_reps), target_weight=coalesce(e.target_weight,te.target_weight),
 coach_video_url=coalesce(e.coach_video_url,te.coach_video_url),
 coach_video_is_external=coalesce(e.coach_video_is_external,te.coach_video_is_external),
 coach_comment=coalesce(e.coach_comment,te.coach_comment), is_template_override=true
from public.workout_template_exercises te where e.template_exercise_id=te.id and not e.is_template_override;

create or replace function public.assign_workout_template(p_program_day_id uuid,p_template_id uuid,p_position int default 0) returns uuid
language plpgsql security invoker set search_path=public as $$
declare v_workout uuid;v_name text;
begin
 if not exists(select 1 from public.program_days d where d.id=p_program_day_id and d.coach_id=(select auth.uid()) and public.is_my_player(d.player_id))
   or not exists(select 1 from public.workout_templates t where t.id=p_template_id and t.coach_id=(select auth.uid()) and t.deleted_at is null) then raise exception 'Access denied';end if;
 select name into v_name from public.workout_templates where id=p_template_id;
 insert into public.workouts(program_day_id,position,name,template_id) values(p_program_day_id,p_position,v_name,p_template_id) returning id into v_workout;
 insert into public.exercises(workout_id,position,name,template_exercise_id,is_template_override,target_sets,target_reps,target_weight,coach_video_url,coach_video_is_external,coach_comment)
 select v_workout,e.position,e.name,e.id,true,e.target_sets,e.target_reps,e.target_weight,e.coach_video_url,e.coach_video_is_external,e.coach_comment from public.workout_template_exercises e where e.template_id=p_template_id order by e.position;
 return v_workout;
end $$;
revoke all on function public.assign_workout_template(uuid,uuid,int) from public;grant execute on function public.assign_workout_template(uuid,uuid,int) to authenticated;
