-- Complete reusable coach Library: lifecycle, sections, revisions, deliveries,
-- engagement, nutrition, tracking, audit history, and team-aware RLS.

create type public.catalog_lifecycle as enum ('draft','published','archived');
create type public.catalog_share_mode as enum ('private','workspace');
create type public.workout_section_format as enum ('standard','interval','amrap','timed','freestyle');
create type public.delivery_status as enum ('scheduled','active','complete','cancelled');
create type public.delivery_sync_mode as enum ('snapshot','follow');

-- Phase 1: lifecycle foundation on the existing reusable libraries.
alter table public.exercise_library
  add column lifecycle public.catalog_lifecycle not null default 'draft',
  add column share_mode public.catalog_share_mode not null default 'private',
  add column tags text[] not null default '{}',
  add column modality text,
  add column measurement_mode text not null default 'reps' check(measurement_mode in('reps','time','distance','load')),
  add column revision int not null default 1 check(revision>0),
  add column deleted_at timestamptz;
alter table public.workout_templates
  add column lifecycle public.catalog_lifecycle not null default 'draft',
  add column share_mode public.catalog_share_mode not null default 'private',
  add column tags text[] not null default '{}',
  add column revision int not null default 1 check(revision>0),
  add column deleted_at timestamptz;
alter table public.program_templates
  add column lifecycle public.catalog_lifecycle not null default 'draft',
  add column share_mode public.catalog_share_mode not null default 'private',
  add column tags text[] not null default '{}',
  add column modality text,
  add column experience_level text,
  add column cover_url text,
  add column live_sync boolean not null default false,
  add column revision int not null default 1 check(revision>0),
  add column deleted_at timestamptz;
alter table public.diet_templates
  add column lifecycle public.catalog_lifecycle not null default 'draft',
  add column share_mode public.catalog_share_mode not null default 'private',
  add column tags text[] not null default '{}',
  add column revision int not null default 1 check(revision>0),
  add column deleted_at timestamptz;

-- Phase 2: reusable workout sections and advanced prescriptions.
create table public.workout_sections(
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check(char_length(trim(name)) between 1 and 200),
  description text,
  format public.workout_section_format not null default 'standard',
  rounds int check(rounds between 1 and 100),
  duration_seconds int check(duration_seconds between 1 and 86400),
  lifecycle public.catalog_lifecycle not null default 'draft',
  share_mode public.catalog_share_mode not null default 'private',
  tags text[] not null default '{}',
  revision int not null default 1 check(revision>0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(coach_id,name)
);
create table public.workout_section_exercises(
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.workout_sections(id) on delete cascade,
  exercise_library_id uuid not null references public.exercise_library(id) on delete restrict,
  position int not null default 0 check(position>=0),
  sets int check(sets between 1 and 100), reps text, seconds int check(seconds between 1 and 86400),
  rest_seconds int check(rest_seconds between 0 and 86400), load_value numeric, load_percent numeric check(load_percent between 0 and 1000),
  tempo text, bilateral boolean not null default false, note text, chain_key text,
  unique(section_id,position)
);
create table public.workout_template_sections(
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  section_id uuid not null references public.workout_sections(id) on delete restrict,
  position int not null default 0 check(position>=0),
  unique(template_id,position)
);
alter table public.workout_template_exercises
  add column section_id uuid references public.workout_sections(id) on delete set null,
  add column rest_seconds int check(rest_seconds between 0 and 86400),
  add column load_percent numeric check(load_percent between 0 and 1000),
  add column tempo text,
  add column bilateral boolean not null default false,
  add column chain_key text;

-- Phase 3: immutable revisions and snapshot/follow delivery records.
create table public.catalog_revisions(
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text not null check(entity_type in('exercise','section','workout','program','task','form','menu','dish','collection','metric_group')),
  entity_id uuid not null, revision int not null check(revision>0), snapshot jsonb not null,
  published_at timestamptz not null default now(), created_by uuid not null references public.profiles(id),
  unique(entity_type,entity_id,revision)
);
create table public.program_deliveries(
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  program_template_id uuid not null references public.program_templates(id) on delete restrict,
  revision int not null check(revision>0), starts_on date not null, starts_at_day int not null default 1 check(starts_at_day>0),
  ends_on date not null, sync_mode public.delivery_sync_mode not null default 'snapshot',
  status public.delivery_status not null default 'scheduled', snapshot jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index program_deliveries_player_idx on public.program_deliveries(player_id,status,starts_on);

-- Phase 4: engagement, forms, responses, metrics, and scheduling.
create table public.coaching_tasks(
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check(char_length(trim(title)) between 1 and 200), instructions text,
  task_type text not null default 'general' check(task_type in('general','progress_photo','body_metrics','form')),
  form_id uuid, lifecycle public.catalog_lifecycle not null default 'draft', share_mode public.catalog_share_mode not null default 'private',
  revision int not null default 1, deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.coach_forms(
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check(char_length(trim(title)) between 1 and 200), description text,
  lifecycle public.catalog_lifecycle not null default 'draft', share_mode public.catalog_share_mode not null default 'private',
  revision int not null default 1, deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.coaching_tasks add constraint coaching_tasks_form_fk foreign key(form_id) references public.coach_forms(id) on delete set null;
create table public.form_questions(
  id uuid primary key default gen_random_uuid(), form_id uuid not null references public.coach_forms(id) on delete cascade,
  prompt text not null check(char_length(trim(prompt)) between 1 and 1000),
  question_type text not null check(question_type in('short_text','long_text','number','single_choice','multiple_choice','date','yes_no')),
  required boolean not null default false, options jsonb not null default '[]', position int not null default 0,
  unique(form_id,position)
);
create table public.form_responses(
  id uuid primary key default gen_random_uuid(), form_id uuid not null references public.coach_forms(id) on delete restrict,
  coach_id uuid not null references public.profiles(id) on delete cascade, player_id uuid not null references public.profiles(id) on delete cascade,
  submitted_at timestamptz, created_at timestamptz not null default now(), unique(form_id,player_id,created_at)
);
create table public.form_answers(
  id uuid primary key default gen_random_uuid(), response_id uuid not null references public.form_responses(id) on delete cascade,
  question_id uuid not null references public.form_questions(id) on delete restrict, value jsonb not null, unique(response_id,question_id)
);
create table public.measurements(
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check(char_length(trim(name)) between 1 and 120), unit text not null, value_type text not null default 'number' check(value_type in('number','percentage','duration')),
  min_value numeric, max_value numeric, deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(coach_id,name)
);
create table public.measurement_groups(
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check(char_length(trim(title)) between 1 and 200), description text,
  lifecycle public.catalog_lifecycle not null default 'draft', share_mode public.catalog_share_mode not null default 'private',
  revision int not null default 1, deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(coach_id,title)
);
create table public.measurement_group_items(
  group_id uuid not null references public.measurement_groups(id) on delete cascade,
  measurement_id uuid not null references public.measurements(id) on delete restrict, position int not null default 0,
  primary key(group_id,measurement_id), unique(group_id,position)
);
create table public.measurement_observations(
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade, measurement_id uuid not null references public.measurements(id) on delete restrict,
  value numeric not null, observed_on date not null default current_date, note text, created_at timestamptz not null default now(),
  unique(player_id,measurement_id,observed_on)
);
create table public.scheduled_coaching_items(
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check(item_type in('task','form','metric_group')),
  item_id uuid not null, scheduled_for timestamptz not null, recurrence jsonb,
  status public.delivery_status not null default 'scheduled', completed_at timestamptz, created_at timestamptz not null default now()
);

-- Phase 5: normalized nutrition library.
create table public.food_items(
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check(char_length(trim(name)) between 1 and 200), category text, default_unit text not null default 'g',
  calories numeric, protein_g numeric, carbs_g numeric, fat_g numeric, fiber_g numeric,
  deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(coach_id,name)
);
create table public.dishes(
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check(char_length(trim(title)) between 1 and 200), summary text, category text, cover_url text, servings numeric not null default 1 check(servings>0), instructions text,
  lifecycle public.catalog_lifecycle not null default 'draft', share_mode public.catalog_share_mode not null default 'private',
  revision int not null default 1, deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(coach_id,title)
);
create table public.dish_components(
  id uuid primary key default gen_random_uuid(), dish_id uuid not null references public.dishes(id) on delete cascade,
  food_item_id uuid not null references public.food_items(id) on delete restrict, quantity numeric not null check(quantity>0), unit text not null, position int not null default 0,
  unique(dish_id,food_item_id)
);
create table public.dish_collections(
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check(char_length(trim(title)) between 1 and 200), description text, cover_url text,
  lifecycle public.catalog_lifecycle not null default 'draft', share_mode public.catalog_share_mode not null default 'private',
  revision int not null default 1, deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(coach_id,title)
);
create table public.collection_dishes(
  collection_id uuid not null references public.dish_collections(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete restrict, position int not null default 0,
  primary key(collection_id,dish_id), unique(collection_id,position)
);
create table public.menu_templates(
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check(char_length(trim(title)) between 1 and 90), description text, cover_url text,
  week_count int not null default 1 check(week_count between 1 and 52),
  lifecycle public.catalog_lifecycle not null default 'draft', share_mode public.catalog_share_mode not null default 'private',
  revision int not null default 1, deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(coach_id,title)
);
create table public.menu_entries(
  id uuid primary key default gen_random_uuid(), menu_template_id uuid not null references public.menu_templates(id) on delete cascade,
  week_number int not null check(week_number between 1 and 52), day_number int not null check(day_number between 1 and 7),
  meal_name text not null, dish_id uuid references public.dishes(id) on delete restrict, note text, position int not null default 0
);

-- Phase 6: append-only audit trail and shared access helpers.
create table public.library_audit_events(
  id bigint generated always as identity primary key, coach_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id), entity_type text not null, entity_id uuid not null,
  action text not null, before_state jsonb, after_state jsonb, created_at timestamptz not null default now()
);
create or replace function public.can_read_coach_library(p_owner uuid,p_share public.catalog_share_mode)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select p_owner=(select auth.uid()) or (p_share='workspace' and public.team_owner_for_member()=p_owner and public.team_role_for_member()='head_coach')
$$;
revoke all on function public.can_read_coach_library(uuid,public.catalog_share_mode) from public;
grant execute on function public.can_read_coach_library(uuid,public.catalog_share_mode) to authenticated;

-- New catalog tables share a consistent owner-write/workspace-read policy.
do $$ declare t text; begin
  foreach t in array array['workout_sections','coaching_tasks','coach_forms','measurement_groups','food_items','dishes','dish_collections','menu_templates','measurements'] loop
    execute format('alter table public.%I enable row level security',t);
    if t=any(array['food_items','measurements']) then
      execute format('create policy %I_owner_all on public.%I for all to authenticated using(coach_id=(select auth.uid())) with check(coach_id=(select auth.uid()))',t,t);
      execute format('create policy %I_team_read on public.%I for select to authenticated using(public.team_owner_for_member()=coach_id and public.team_role_for_member()=''head_coach'')',t,t);
    else
      execute format('create policy %I_owner_all on public.%I for all to authenticated using(coach_id=(select auth.uid())) with check(coach_id=(select auth.uid()))',t,t);
      execute format('create policy %I_team_read on public.%I for select to authenticated using(public.can_read_coach_library(coach_id,share_mode))',t,t);
    end if;
  end loop;
end $$;

-- Child-table policies inherit access through their parent.
alter table public.workout_section_exercises enable row level security;
alter table public.workout_template_sections enable row level security;
alter table public.catalog_revisions enable row level security;
alter table public.program_deliveries enable row level security;
alter table public.form_questions enable row level security;
alter table public.form_responses enable row level security;
alter table public.form_answers enable row level security;
alter table public.measurement_group_items enable row level security;
alter table public.measurement_observations enable row level security;
alter table public.scheduled_coaching_items enable row level security;
alter table public.dish_components enable row level security;
alter table public.collection_dishes enable row level security;
alter table public.menu_entries enable row level security;
alter table public.library_audit_events enable row level security;

create policy section_exercises_access on public.workout_section_exercises for all to authenticated using(exists(select 1 from public.workout_sections s where s.id=section_id and s.coach_id=(select auth.uid()))) with check(exists(select 1 from public.workout_sections s where s.id=section_id and s.coach_id=(select auth.uid())));
create policy template_sections_access on public.workout_template_sections for all to authenticated using(exists(select 1 from public.workout_templates t where t.id=template_id and t.coach_id=(select auth.uid()))) with check(exists(select 1 from public.workout_templates t where t.id=template_id and t.coach_id=(select auth.uid())));
create policy revisions_owner_access on public.catalog_revisions for all to authenticated using(coach_id=(select auth.uid())) with check(coach_id=(select auth.uid()) and created_by=(select auth.uid()));
create policy deliveries_coach_access on public.program_deliveries for all to authenticated using(coach_id=(select auth.uid())) with check(coach_id=(select auth.uid()) and public.is_my_player(player_id));
create policy deliveries_player_read on public.program_deliveries for select to authenticated using(player_id=(select auth.uid()));
create policy form_questions_access on public.form_questions for all to authenticated using(exists(select 1 from public.coach_forms f where f.id=form_id and f.coach_id=(select auth.uid()))) with check(exists(select 1 from public.coach_forms f where f.id=form_id and f.coach_id=(select auth.uid())));
create policy form_responses_parties on public.form_responses for select to authenticated using(coach_id=(select auth.uid()) or player_id=(select auth.uid()));
create policy form_responses_player_insert on public.form_responses for insert to authenticated with check(player_id=(select auth.uid()));
create policy form_answers_parties on public.form_answers for all to authenticated using(exists(select 1 from public.form_responses r where r.id=response_id and (r.coach_id=(select auth.uid()) or r.player_id=(select auth.uid())))) with check(exists(select 1 from public.form_responses r where r.id=response_id and r.player_id=(select auth.uid())));
create policy metric_group_items_access on public.measurement_group_items for all to authenticated using(exists(select 1 from public.measurement_groups g where g.id=group_id and g.coach_id=(select auth.uid()))) with check(exists(select 1 from public.measurement_groups g where g.id=group_id and g.coach_id=(select auth.uid())));
create policy observations_parties on public.measurement_observations for select to authenticated using(coach_id=(select auth.uid()) or player_id=(select auth.uid()));
create policy observations_coach_write on public.measurement_observations for all to authenticated using(coach_id=(select auth.uid())) with check(coach_id=(select auth.uid()) and public.is_my_player(player_id));
create policy scheduled_parties on public.scheduled_coaching_items for select to authenticated using(coach_id=(select auth.uid()) or player_id=(select auth.uid()));
create policy scheduled_coach_write on public.scheduled_coaching_items for all to authenticated using(coach_id=(select auth.uid())) with check(coach_id=(select auth.uid()) and public.is_my_player(player_id));
create policy dish_components_access on public.dish_components for all to authenticated using(exists(select 1 from public.dishes d where d.id=dish_id and d.coach_id=(select auth.uid()))) with check(exists(select 1 from public.dishes d where d.id=dish_id and d.coach_id=(select auth.uid())));
create policy collection_dishes_access on public.collection_dishes for all to authenticated using(exists(select 1 from public.dish_collections c where c.id=collection_id and c.coach_id=(select auth.uid()))) with check(exists(select 1 from public.dish_collections c where c.id=collection_id and c.coach_id=(select auth.uid())));
create policy menu_entries_access on public.menu_entries for all to authenticated using(exists(select 1 from public.menu_templates m where m.id=menu_template_id and m.coach_id=(select auth.uid()))) with check(exists(select 1 from public.menu_templates m where m.id=menu_template_id and m.coach_id=(select auth.uid())));
create policy audit_owner_read on public.library_audit_events for select to authenticated using(coach_id=(select auth.uid()));

-- Existing team-library policies now respect the explicit workspace share mode.
drop policy if exists exercise_library_team_read on public.exercise_library;
drop policy if exists workout_templates_team_read on public.workout_templates;
drop policy if exists workout_template_exercises_team_read on public.workout_template_exercises;
drop policy if exists diet_templates_team_read on public.diet_templates;
drop policy if exists program_templates_team_read on public.program_templates;
drop policy if exists program_template_days_team_read on public.program_template_days;
drop policy if exists program_template_day_workouts_team_read on public.program_template_day_workouts;
create policy exercise_library_team_read on public.exercise_library for select to authenticated using(share_mode='workspace' and public.team_owner_for_member()=coach_id and public.team_role_for_member()='head_coach');
create policy workout_templates_team_read on public.workout_templates for select to authenticated using(share_mode='workspace' and public.team_owner_for_member()=coach_id and public.team_role_for_member()='head_coach');
create policy workout_template_exercises_team_read on public.workout_template_exercises for select to authenticated using(exists(select 1 from public.workout_templates t where t.id=template_id and t.share_mode='workspace' and public.team_owner_for_member()=t.coach_id and public.team_role_for_member()='head_coach'));
create policy diet_templates_team_read on public.diet_templates for select to authenticated using(share_mode='workspace' and public.team_owner_for_member()=coach_id and public.team_role_for_member()='head_coach');
create policy program_templates_team_read on public.program_templates for select to authenticated using(share_mode='workspace' and public.team_owner_for_member()=coach_id and public.team_role_for_member()='head_coach');
create policy program_template_days_team_read on public.program_template_days for select to authenticated using(exists(select 1 from public.program_templates p where p.id=program_template_id and p.share_mode='workspace' and public.team_owner_for_member()=p.coach_id and public.team_role_for_member()='head_coach'));
create policy program_template_day_workouts_team_read on public.program_template_day_workouts for select to authenticated using(exists(select 1 from public.program_template_days d join public.program_templates p on p.id=d.program_template_id where d.id=program_template_day_id and p.share_mode='workspace' and public.team_owner_for_member()=p.coach_id and public.team_role_for_member()='head_coach'));

create or replace function public.record_library_change() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_row jsonb; v_before jsonb; v_owner uuid; v_id uuid;
begin
 if tg_op='DELETE' then v_row:=to_jsonb(old); v_before:=v_row; else v_row:=to_jsonb(new); v_before:=case when tg_op='UPDATE' then to_jsonb(old) else null end; end if;
 v_owner:=(v_row->>'coach_id')::uuid; v_id:=(v_row->>'id')::uuid;
 if v_owner is not null and v_id is not null then
  insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,before_state,after_state)
  values(v_owner,coalesce((select auth.uid()),v_owner),tg_table_name,v_id,lower(tg_op),v_before,case when tg_op='DELETE' then null else v_row end);
 end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
do $$ declare t text; begin
 foreach t in array array['exercise_library','workout_sections','workout_templates','program_templates','diet_templates','coaching_tasks','coach_forms','measurement_groups','food_items','dishes','dish_collections','menu_templates'] loop
  execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.record_library_change()',t,t);
 end loop;
end $$;

create or replace function public.publish_library_item(p_table text,p_id uuid) returns int
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_allowed constant text[]:=array['exercise_library','workout_sections','workout_templates','program_templates','diet_templates','coaching_tasks','coach_forms','measurement_groups','dishes','dish_collections','menu_templates']; v_owner uuid; v_revision int; v_snapshot jsonb;
begin
 if not p_table=any(v_allowed) then raise exception 'Unsupported library type'; end if;
 execute format('select coach_id,revision,to_jsonb(x) from public.%I x where id=$1 and deleted_at is null',p_table) into v_owner,v_revision,v_snapshot using p_id;
 if v_owner is null or v_owner<>(select auth.uid()) then raise exception 'Access denied'; end if;
 v_revision:=v_revision+1;
 execute format('update public.%I set lifecycle=''published'',revision=$2,updated_at=now() where id=$1',p_table) using p_id,v_revision;
 insert into public.catalog_revisions(coach_id,entity_type,entity_id,revision,snapshot,created_by) values(v_owner,p_table,p_id,v_revision,v_snapshot||jsonb_build_object('revision',v_revision,'lifecycle','published'),(select auth.uid()));
 insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,before_state,after_state) values(v_owner,(select auth.uid()),p_table,p_id,'publish',v_snapshot,v_snapshot||jsonb_build_object('revision',v_revision,'lifecycle','published'));
 return v_revision;
end $$;
revoke all on function public.publish_library_item(text,uuid) from public;
grant execute on function public.publish_library_item(text,uuid) to authenticated;

create or replace function public.soft_delete_library_item(p_table text,p_id uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_allowed constant text[]:=array['exercise_library','workout_sections','workout_templates','program_templates','diet_templates','coaching_tasks','coach_forms','measurement_groups','food_items','dishes','dish_collections','menu_templates']; v_owner uuid; v_snapshot jsonb;
begin
 if not p_table=any(v_allowed) then raise exception 'Unsupported library type'; end if;
 execute format('select coach_id,to_jsonb(x) from public.%I x where id=$1',p_table) into v_owner,v_snapshot using p_id;
 if v_owner is null or v_owner<>(select auth.uid()) then raise exception 'Access denied'; end if;
 execute format('update public.%I set deleted_at=now(),updated_at=now() where id=$1',p_table) using p_id;
 insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,before_state) values(v_owner,(select auth.uid()),p_table,p_id,'archive',v_snapshot);
end $$;
revoke all on function public.soft_delete_library_item(text,uuid) from public;
grant execute on function public.soft_delete_library_item(text,uuid) to authenticated;

create or replace function public.create_program_delivery(p_player_id uuid,p_program_template_id uuid,p_starts_on date,p_starts_at_day int default 1,p_sync_mode public.delivery_sync_mode default 'snapshot')
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_program public.program_templates; v_snapshot jsonb; v_delivery uuid; v_end date;
begin
 if not public.is_my_player(p_player_id) then raise exception 'Player is not linked to this coach'; end if;
 select * into v_program from public.program_templates where id=p_program_template_id and coach_id=(select auth.uid()) and deleted_at is null;
 if not found then raise exception 'Program template not found'; end if;
 if p_starts_at_day<1 or p_starts_at_day>(v_program.duration_weeks*7) then raise exception 'Starting day is outside this program'; end if;
 select jsonb_build_object('program',to_jsonb(v_program),'days',coalesce(jsonb_agg(jsonb_build_object('day',to_jsonb(d),'workouts',(select coalesce(jsonb_agg(to_jsonb(w) order by w.position),'[]'::jsonb) from public.program_template_day_workouts w where w.program_template_day_id=d.id)) order by d.week_number,d.day_number),'[]'::jsonb))
 into v_snapshot from public.program_template_days d where d.program_template_id=v_program.id;
 v_end:=p_starts_on+greatest(0,(v_program.duration_weeks*7)-p_starts_at_day);
 insert into public.program_deliveries(coach_id,player_id,program_template_id,revision,starts_on,starts_at_day,ends_on,sync_mode,status,snapshot)
 values((select auth.uid()),p_player_id,v_program.id,v_program.revision,p_starts_on,p_starts_at_day,v_end,p_sync_mode,case when p_starts_on<=current_date then 'active' else 'scheduled' end,v_snapshot)
 returning id into v_delivery;
 perform public.assign_program_template_to_player(p_player_id,p_program_template_id,1);
 insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,after_state)
 values((select auth.uid()),(select auth.uid()),'program_delivery',v_delivery,'assign',jsonb_build_object('player_id',p_player_id,'program_template_id',p_program_template_id,'revision',v_program.revision,'sync_mode',p_sync_mode));
 return v_delivery;
end $$;
revoke all on function public.create_program_delivery(uuid,uuid,date,int,public.delivery_sync_mode) from public;
grant execute on function public.create_program_delivery(uuid,uuid,date,int,public.delivery_sync_mode) to authenticated;

create index workout_sections_owner_idx on public.workout_sections(coach_id,lifecycle,updated_at desc) where deleted_at is null;
create index tasks_owner_idx on public.coaching_tasks(coach_id,lifecycle,updated_at desc) where deleted_at is null;
create index forms_owner_idx on public.coach_forms(coach_id,lifecycle,updated_at desc) where deleted_at is null;
create index food_items_owner_idx on public.food_items(coach_id,lower(name)) where deleted_at is null;
create index dishes_owner_idx on public.dishes(coach_id,lifecycle,updated_at desc) where deleted_at is null;
create index menu_templates_owner_idx on public.menu_templates(coach_id,lifecycle,updated_at desc) where deleted_at is null;
