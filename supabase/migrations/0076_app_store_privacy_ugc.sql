-- App Store privacy, creator identity, UGC safety, reporting, blocking and
-- account-deletion support. Existing assignments and catalog revisions remain.

alter table public.profiles
  add column if not exists public_display_name text,
  add column if not exists public_attribution text,
  add column if not exists community_standards_accepted_at timestamptz,
  add column if not exists community_standards_version int,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text,
  add column if not exists deletion_requested_at timestamptz;

alter table public.profiles
  add constraint profiles_public_display_name_safe check (
    public_display_name is null or (
      char_length(trim(public_display_name)) between 2 and 80
      and public_display_name !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    )
  );

create or replace function public.auth_role()
returns public.user_role
language sql stable security definer set search_path=public as $$
  select case
    when p.suspended_at is not null then null
    when p.role='admin' and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then null
    else p.role
  end
  from public.profiles p where p.id=(select auth.uid())
$$;
revoke all on function public.auth_role() from public;
grant execute on function public.auth_role() to authenticated;

do $$ declare v_table text; begin
  foreach v_table in array array['exercise_library','workout_templates','food_items','dishes','menu_templates'] loop
    execute format('alter table public.%I add column if not exists ownership_attestation text check(ownership_attestation is null or ownership_attestation in (''original'',''licensed'',''linked''))',v_table);
    execute format('alter table public.%I add column if not exists creator_attribution text',v_table);
    execute format('alter table public.%I add column if not exists publication_state text not null default ''pending'' check(publication_state in (''pending'',''clean'',''quarantined''))',v_table);
    execute format('alter table public.%I add column if not exists moderation_checked_at timestamptz',v_table);
  end loop;
end $$;

-- Preserve currently discoverable public content. These rows were published
-- before automated publication checks existed and must not disappear when the
-- new public-read policies are installed. Future edits are checked by the
-- publication guard below.
do $$ declare v_table text; begin
  foreach v_table in array array['exercise_library','workout_templates','food_items','dishes','menu_templates'] loop
    execute format(
      'update public.%I set publication_state=''clean'', moderation_checked_at=coalesce(moderation_checked_at,now()) where visibility=''public'' and lifecycle=''published'' and moderation_status=''visible'' and deleted_at is null',
      v_table
    );
  end loop;
end $$;

-- Never expose an email address left in historical public creator labels.
do $$ declare v_table text; begin
  foreach v_table in array array['exercise_library','workout_templates','food_items','dishes','menu_templates'] loop
    execute format('update public.%I set creator_name=''Trainova coach'' where creator_name ~* ''^[^@\s]+@[^@\s]+\.[^@\s]+$''',v_table);
    execute format('update public.%I set creator_attribution=coalesce(nullif(trim(creator_name),''''),''Trainova coach'') where visibility=''public'' and creator_attribution is null',v_table);
  end loop;
end $$;

create or replace function public.catalog_publication_guard()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_payload jsonb:=to_jsonb(new);
  v_text text:=lower(v_payload::text);
  v_display text;
  v_attribution text;
  v_accept timestamptz;
  v_version int;
  v_media text:=coalesce(v_payload->>'image_url',v_payload->>'cover_image_url',v_payload->>'cover_url',v_payload->>'video_url','');
  v_unsafe text;
begin
  -- Administrator takedown/restore actions must not be rewritten as a fresh
  -- creator publication by this trigger.
  if tg_op='UPDATE' and public.auth_role()='admin' and (new.moderation_status is distinct from old.moderation_status or new.moderated_at is distinct from old.moderated_at) then return new;end if;
  if new.visibility<>'public' or new.lifecycle<>'published' then return new; end if;
  select public_display_name,coalesce(nullif(trim(public_attribution),''),public_display_name),community_standards_accepted_at,community_standards_version
    into v_display,v_attribution,v_accept,v_version from public.profiles where id=new.coach_id;
  if v_display is null or v_accept is null or coalesce(v_version,0)<1 then
    raise exception 'Confirm a safe public display name and accept the Community Standards first';
  end if;
  if v_payload->>'ownership_attestation' is null then
    raise exception 'Confirm whether the content is original, licensed, or linked';
  end if;
  if v_payload->>'ownership_attestation' in ('licensed','linked') and
     (nullif(trim(v_payload->>'source_url'),'') is null or nullif(trim(v_payload->>'source_license'),'') is null or nullif(trim(v_payload->>'source_attribution'),'') is null) then
    raise exception 'Third-party content requires source, license, and attribution';
  end if;
  if v_text ~ '(porn|sexual abuse|rape|nazi|kill yourself|racial slur|terrorist instruction|buy steroids|suicide method)' then v_unsafe:='abusive_or_prohibited_text'; end if;
  if v_text ~ '(javascript:|data:text/html|bit\.ly/|tinyurl\.com/|<script|onerror\s*=)' then v_unsafe:=coalesce(v_unsafe,'malicious_or_shortened_url'); end if;
  if v_text ~ '(inject\s+insulin|extreme dehydration|starve yourself|train through chest pain|ignore medical advice)' then v_unsafe:=coalesce(v_unsafe,'dangerous_fitness_instruction'); end if;
  if v_media<>'' and v_media !~* '^https://' and v_media !~* '^r2:' then v_unsafe:=coalesce(v_unsafe,'unsupported_media'); end if;
  if coalesce(v_payload->>'source_provider','') in ('wger','usda_fdc','open_food_facts') and v_media<>'' then v_unsafe:=coalesce(v_unsafe,'external_media_rights_unverified'); end if;
  if v_unsafe is not null then
    new.visibility:='private';
    new.lifecycle:='draft';
    new.publication_state:='quarantined';
    new.moderation_status:='hidden';
    new.moderation_reason:=v_unsafe;
    new.moderation_checked_at:=now();
    return new;
  end if;
  new.creator_name:=v_display;
  new.creator_attribution:=v_attribution;
  new.publication_state:='clean';
  new.moderation_status:='visible';
  new.moderation_reason:=null;
  new.moderation_checked_at:=now();
  return new;
end $$;

create or replace function public.bump_public_catalog_revision() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if old.visibility='public' and (select auth.uid())=old.coach_id and new.revision=old.revision and
    (to_jsonb(new)-array['revision','updated_at','moderation_status','moderated_at','moderated_by','moderation_reason','moderation_checked_at','publication_state']) is distinct from
    (to_jsonb(old)-array['revision','updated_at','moderation_status','moderated_at','moderated_by','moderation_reason','moderation_checked_at','publication_state']) then
    new.revision:=old.revision+1;
  end if;
  return new;
end $$;

do $$ declare v_table text; begin
  foreach v_table in array array['exercise_library','workout_templates','food_items','dishes','menu_templates'] loop
    execute format('drop trigger if exists %I on public.%I',v_table||'_publication_guard',v_table);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.catalog_publication_guard()',v_table||'_publication_guard',v_table);
  end loop;
end $$;

create or replace function public.publish_catalog_item_compliant(
  p_table text,p_id uuid,p_visibility public.catalog_visibility,
  p_display_name text default null,p_public_attribution text default null,
  p_accept_standards boolean default false,p_ownership text default null,
  p_source_url text default null,p_source_license text default null,p_source_attribution text default null
) returns int language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner uuid;v_revision int;v_snapshot jsonb;v_name text;v_after jsonb;
begin
  if not p_table=any(array['exercise_library','workout_templates','food_items','dishes','menu_templates']) then raise exception 'Unsupported library type';end if;
  execute format('select coach_id,revision,to_jsonb(x) from public.%I x where id=$1 and deleted_at is null',p_table) into v_owner,v_revision,v_snapshot using p_id;
  if v_owner is null or v_owner<>(select auth.uid()) then raise exception 'Access denied';end if;
  if p_visibility='public' then
    if p_display_name is not null then
      if char_length(trim(p_display_name)) not between 2 and 80 or p_display_name ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Choose a public display name that is not an email address';end if;
      update public.profiles set public_display_name=trim(p_display_name),public_attribution=nullif(trim(p_public_attribution),'') where id=v_owner;
    end if;
    if p_accept_standards then update public.profiles set community_standards_accepted_at=now(),community_standards_version=1 where id=v_owner;end if;
    if not coalesce(p_ownership,'')=any(array['original','licensed','linked']) then raise exception 'Choose original, licensed, or linked content';end if;
    execute format('update public.%I set ownership_attestation=$2,source_url=coalesce(nullif(trim($3),''''),source_url),source_license=coalesce(nullif(trim($4),''''),source_license),source_attribution=coalesce(nullif(trim($5),''''),source_attribution) where id=$1',p_table)
      using p_id,p_ownership,p_source_url,p_source_license,p_source_attribution;
  end if;
  select coalesce(nullif(trim(public_display_name),''),'Trainova coach') into v_name from public.profiles where id=v_owner;
  v_revision:=v_revision+1;
  execute format('update public.%I as x set lifecycle=''published'',visibility=$2,creator_name=$3,revision=$4,updated_at=now() where id=$1 returning to_jsonb(x)',p_table)
    into v_after using p_id,p_visibility,v_name,v_revision;
  insert into public.catalog_revisions(coach_id,entity_type,entity_id,revision,snapshot,created_by)
    values(v_owner,public.catalog_entity_type(p_table),p_id,v_revision,v_after,(select auth.uid())) on conflict do nothing;
  insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,before_state,after_state)
    values(v_owner,(select auth.uid()),p_table,p_id,case when coalesce(v_after->>'publication_state','')='quarantined' then 'publication_quarantined' when p_visibility='public' then 'publish_public_clean' else 'publish_private' end,v_snapshot,v_after);
  return v_revision;
end $$;
revoke all on function public.publish_catalog_item_compliant(text,uuid,public.catalog_visibility,text,text,boolean,text,text,text,text) from public;
grant execute on function public.publish_catalog_item_compliant(text,uuid,public.catalog_visibility,text,text,boolean,text,text,text,text) to authenticated;

alter table public.catalog_item_reports
  add column if not exists reason_code text,
  add column if not exists details text,
  add column if not exists severity text not null default 'normal' check(severity in('urgent','high','normal','low')),
  add column if not exists acknowledged_at timestamptz,
  add column if not exists item_preview jsonb,
  add column if not exists owner_preview text,
  add column if not exists escalation_notes text,
  add column if not exists action_taken text;

create or replace function public.report_catalog_item_compliant(
  p_table text,p_id uuid,p_reason_code text,p_details text default null
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner uuid;v_report uuid;v_preview jsonb;v_severity text;
begin
  if public.auth_role() is distinct from 'coach' then raise exception 'Access denied';end if;
  if not p_table=any(array['exercise_library','workout_templates','food_items','dishes','menu_templates']) then raise exception 'Unsupported library type';end if;
  if not coalesce(p_reason_code,'')=any(array['abuse','dangerous_content','sexual_content','violence','spam','malicious_link','copyright','privacy','duplicate','other']) then raise exception 'Invalid report reason';end if;
  if p_details is not null and char_length(p_details)>2000 then raise exception 'Report details are too long';end if;
  execute format('select coach_id,to_jsonb(x)-array[''coach_id'',''external_id''] from public.%I x where id=$1 and visibility=''public'' and lifecycle=''published'' and moderation_status=''visible'' and publication_state=''clean'' and deleted_at is null',p_table)
    into v_owner,v_preview using p_id;
  if v_owner is null then raise exception 'Public item not found';end if;
  v_severity:=case when p_reason_code in('dangerous_content','sexual_content','violence') then 'urgent' else 'normal' end;
  insert into public.catalog_item_reports(reporter_id,owner_id,entity_type,entity_id,reason,reason_code,details,severity,item_preview,owner_preview,status)
    values((select auth.uid()),v_owner,p_table,p_id,p_reason_code,p_reason_code,nullif(trim(p_details),''),v_severity,v_preview,
      coalesce((select public_display_name from public.profiles where id=v_owner),'Trainova coach'),'open')
    on conflict(reporter_id,entity_type,entity_id,status) do update set reason=excluded.reason,reason_code=excluded.reason_code,
      details=excluded.details,severity=excluded.severity,item_preview=excluded.item_preview,updated_at=now()
    returning id into v_report;
  insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,after_state)
    values(v_owner,(select auth.uid()),p_table,p_id,'report',jsonb_build_object('report_id',v_report,'reason_code',p_reason_code,'severity',v_severity));
  return v_report;
end $$;
revoke all on function public.report_catalog_item_compliant(text,uuid,text,text) from public;
grant execute on function public.report_catalog_item_compliant(text,uuid,text,text) to authenticated;

create or replace function public.moderate_catalog_item(p_table text,p_id uuid,p_status public.catalog_moderation_status,p_reason text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner uuid;v_before jsonb;v_after jsonb;
begin
 if public.auth_role() is distinct from 'admin' then raise exception 'Access denied';end if;
 if not p_table=any(array['exercise_library','workout_templates','food_items','dishes','menu_templates']) then raise exception 'Unsupported library type';end if;
 execute format('select coach_id,to_jsonb(x) from public.%I x where id=$1',p_table) into v_owner,v_before using p_id;
 if v_owner is null then raise exception 'Item not found';end if;
 execute format('update public.%I set moderation_status=$2,moderated_at=now(),moderated_by=$3,moderation_reason=$4,updated_at=now() where id=$1',p_table) using p_id,p_status,(select auth.uid()),nullif(trim(p_reason),'');
 execute format('select to_jsonb(x) from public.%I x where id=$1',p_table) into v_after using p_id;
 update public.catalog_item_reports set status=case when p_status='visible' then 'dismissed'::public.catalog_report_status else 'resolved'::public.catalog_report_status end,
   acknowledged_at=coalesce(acknowledged_at,now()),reviewed_by=(select auth.uid()),reviewed_at=now(),resolution_note=nullif(trim(p_reason),''),
   escalation_notes=nullif(trim(p_reason),''),action_taken=case when p_status='visible' then 'restored_or_dismissed' else p_status::text end,updated_at=now()
   where entity_type=p_table and entity_id=p_id and status in('open','reviewing');
 insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,before_state,after_state)
   values(v_owner,(select auth.uid()),p_table,p_id,case when p_status='visible' then 'moderation_restore' else 'moderation_'||p_status::text end,v_before,v_after);
end $$;

create table public.ugc_reports(
  id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  content_type text not null check(content_type in('chat_message','support_message','media')),
  content_id uuid not null, reason_code text not null,
  details text check(details is null or char_length(details)<=2000), severity text not null default 'normal' check(severity in('urgent','high','normal','low')),
  preview jsonb not null default '{}'::jsonb, status public.catalog_report_status not null default 'open',
  acknowledged_at timestamptz,reviewed_by uuid references public.profiles(id),reviewed_at timestamptz,
  escalation_notes text,action_taken text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.ugc_reports enable row level security;
create policy ugc_reports_reporter_read on public.ugc_reports for select to authenticated using(reporter_id=(select auth.uid()));
create policy ugc_reports_admin_all on public.ugc_reports for all to authenticated using(public.auth_role()='admin') with check(public.auth_role()='admin');

create table public.user_blocks(
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null default 'catalog' check(scope in('catalog','chat','all')),
  reason text,created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id,scope),check(blocker_id<>blocked_id)
);
alter table public.user_blocks enable row level security;
create policy user_blocks_owner_all on public.user_blocks for all to authenticated using(blocker_id=(select auth.uid())) with check(blocker_id=(select auth.uid()));
create policy user_blocks_admin_read on public.user_blocks for select to authenticated using(public.auth_role()='admin');

do $$ declare v_table text; begin
  foreach v_table in array array['exercise_library','workout_templates','food_items','dishes','menu_templates'] loop
    execute format('drop policy if exists %I on public.%I',v_table||'_public_read',v_table);
    execute format('create policy %I on public.%I for select to authenticated using(public.auth_role() in (''coach'',''admin'') and visibility=''public'' and lifecycle=''published'' and moderation_status=''visible'' and publication_state=''clean'' and deleted_at is null and not exists(select 1 from public.user_blocks b where b.blocker_id=(select auth.uid()) and b.blocked_id=coach_id and b.scope in(''catalog'',''all'')))',v_table||'_public_read',v_table);
  end loop;
end $$;

drop policy if exists workout_template_exercises_public_read on public.workout_template_exercises;
create policy workout_template_exercises_public_read on public.workout_template_exercises for select to authenticated using(exists(
  select 1 from public.workout_templates t where t.id=template_id and t.visibility='public' and t.lifecycle='published'
    and t.moderation_status='visible' and t.publication_state='clean' and t.deleted_at is null
    and not exists(select 1 from public.user_blocks b where b.blocker_id=(select auth.uid()) and b.blocked_id=t.coach_id and b.scope in('catalog','all'))
));
drop policy if exists dish_components_public_read on public.dish_components;
create policy dish_components_public_read on public.dish_components for select to authenticated using(exists(
  select 1 from public.dishes d where d.id=dish_id and d.visibility='public' and d.lifecycle='published'
    and d.moderation_status='visible' and d.publication_state='clean' and d.deleted_at is null
    and not exists(select 1 from public.user_blocks b where b.blocker_id=(select auth.uid()) and b.blocked_id=d.coach_id and b.scope in('catalog','all'))
));
drop policy if exists menu_entries_public_read on public.menu_entries;
create policy menu_entries_public_read on public.menu_entries for select to authenticated using(exists(
  select 1 from public.menu_templates m where m.id=menu_template_id and m.visibility='public' and m.lifecycle='published'
    and m.moderation_status='visible' and m.publication_state='clean' and m.deleted_at is null
    and not exists(select 1 from public.user_blocks b where b.blocker_id=(select auth.uid()) and b.blocked_id=m.coach_id and b.scope in('catalog','all'))
));
drop policy if exists food_items_public_recipe_read on public.food_items;
create policy food_items_public_recipe_read on public.food_items for select to authenticated using(exists(
  select 1 from public.dish_components c join public.dishes d on d.id=c.dish_id where c.food_item_id=food_items.id
    and d.visibility='public' and d.lifecycle='published' and d.moderation_status='visible' and d.publication_state='clean' and d.deleted_at is null
    and not exists(select 1 from public.user_blocks b where b.blocker_id=(select auth.uid()) and b.blocked_id=d.coach_id and b.scope in('catalog','all'))
));

create policy chat_not_blocked_insert on public.chat_messages as restrictive for insert to authenticated with check (
  not exists(select 1 from public.user_blocks b where b.scope in('chat','all') and ((b.blocker_id=coach_id and b.blocked_id=player_id) or (b.blocker_id=player_id and b.blocked_id=coach_id)))
);

create or replace function public.block_user(p_user uuid,p_scope text default 'catalog',p_reason text default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if p_scope not in('catalog','chat','all') or p_user=(select auth.uid()) or not exists(select 1 from public.profiles where id=p_user) then raise exception 'Invalid block';end if;
  insert into public.user_blocks(blocker_id,blocked_id,scope,reason) values((select auth.uid()),p_user,p_scope,nullif(trim(p_reason),'')) on conflict do nothing;
  insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,after_state)
    values((select auth.uid()),(select auth.uid()),'user_block',p_user,'block',jsonb_build_object('scope',p_scope));
end $$;
revoke all on function public.block_user(uuid,text,text) from public;grant execute on function public.block_user(uuid,text,text) to authenticated;

create or replace function public.report_ugc(p_type text,p_id uuid,p_reason text,p_details text default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_report uuid;v_user uuid;v_preview jsonb;v_severity text;
begin
  if p_reason not in('abuse','dangerous_content','sexual_content','violence','spam','malicious_link','copyright','privacy','other') then raise exception 'Invalid report reason';end if;
  if p_type='chat_message' then select sender_id,jsonb_build_object('body',left(body,240),'created_at',created_at) into v_user,v_preview from public.chat_messages where id=p_id and (coach_id=(select auth.uid()) or player_id=(select auth.uid()));
  elsif p_type='support_message' then select sender_id,jsonb_build_object('body',left(body,240),'attachment_type',attachment_type,'created_at',created_at) into v_user,v_preview from public.admin_messages where id=p_id and (coach_id=(select auth.uid()) or public.auth_role()='admin');
  else raise exception 'Unsupported report type';end if;
  if v_user is null then raise exception 'Content not found';end if;
  v_severity:=case when p_reason in('sexual_content','violence','dangerous_content') then 'urgent' else 'normal' end;
  insert into public.ugc_reports(reporter_id,reported_user_id,content_type,content_id,reason_code,details,severity,preview)
    values((select auth.uid()),v_user,p_type,p_id,p_reason,nullif(trim(p_details),''),v_severity,coalesce(v_preview,'{}')) returning id into v_report;
  insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,after_state)
    values((select auth.uid()),(select auth.uid()),p_type,p_id,'report',jsonb_build_object('report_id',v_report,'reason_code',p_reason,'severity',v_severity));
  return v_report;
end $$;
revoke all on function public.report_ugc(text,uuid,text,text) from public;grant execute on function public.report_ugc(text,uuid,text,text) to authenticated;

create or replace function public.moderate_user_account(p_user uuid,p_suspend boolean,p_reason text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if public.auth_role() is distinct from 'admin' then raise exception 'Access denied';end if;
  update public.profiles set suspended_at=case when p_suspend then now() else null end,suspension_reason=case when p_suspend then nullif(trim(p_reason),'') else null end where id=p_user and role<>'admin';
  if p_suspend then
    update public.coach_player_links set status='revoked' where coach_id=p_user or player_id=p_user;
    update public.coach_team_members set status='revoked' where member_id=p_user;
  end if;
  insert into public.library_audit_events(coach_id,actor_id,entity_type,entity_id,action,after_state)
    values(p_user,(select auth.uid()),'user_account',p_user,case when p_suspend then 'suspend' else 'restore_user' end,jsonb_build_object('reason',nullif(trim(p_reason),'')));
end $$;
revoke all on function public.moderate_user_account(uuid,boolean,text) from public;grant execute on function public.moderate_user_account(uuid,boolean,text) to authenticated;

create table public.account_deletion_audit(
  id uuid primary key default gen_random_uuid(),actor_hash text not null,role text not null,
  requested_at timestamptz not null,completed_at timestamptz not null default now(),
  retained_until timestamptz not null,reason text not null
);
create table public.account_file_deletion_queue(
  id uuid primary key default gen_random_uuid(),object_key text not null,provider text not null,
  attempts int not null default 0,last_error text,created_at timestamptz not null default now(),deleted_at timestamptz
);
alter table public.account_deletion_audit enable row level security;
alter table public.account_file_deletion_queue enable row level security;
revoke all on public.account_deletion_audit,public.account_file_deletion_queue from anon,authenticated;

-- Keep necessary audit/moderation history without retaining a deleted user's
-- profile. References that are historical become anonymous when the profile is
-- removed; user-owned content and ordinary messages still follow their existing
-- cascade rules.
alter table public.coach_team_invites drop constraint if exists coach_team_invites_claimed_by_fkey;
alter table public.coach_team_invites add constraint coach_team_invites_claimed_by_fkey foreign key(claimed_by) references public.profiles(id) on delete set null;
alter table public.catalog_revisions alter column created_by drop not null;
alter table public.catalog_revisions drop constraint if exists catalog_revisions_created_by_fkey;
alter table public.catalog_revisions add constraint catalog_revisions_created_by_fkey foreign key(created_by) references public.profiles(id) on delete set null;
alter table public.library_audit_events alter column actor_id drop not null;
alter table public.library_audit_events drop constraint if exists library_audit_events_actor_id_fkey;
alter table public.library_audit_events add constraint library_audit_events_actor_id_fkey foreign key(actor_id) references public.profiles(id) on delete set null;
alter table public.catalog_item_reports alter column reporter_id drop not null;
alter table public.catalog_item_reports alter column owner_id drop not null;
alter table public.catalog_item_reports drop constraint if exists catalog_item_reports_reporter_id_fkey;
alter table public.catalog_item_reports drop constraint if exists catalog_item_reports_owner_id_fkey;
alter table public.catalog_item_reports drop constraint if exists catalog_item_reports_reviewed_by_fkey;
alter table public.catalog_item_reports add constraint catalog_item_reports_reporter_id_fkey foreign key(reporter_id) references public.profiles(id) on delete set null;
alter table public.catalog_item_reports add constraint catalog_item_reports_owner_id_fkey foreign key(owner_id) references public.profiles(id) on delete set null;
alter table public.catalog_item_reports add constraint catalog_item_reports_reviewed_by_fkey foreign key(reviewed_by) references public.profiles(id) on delete set null;
alter table public.external_catalog_sources drop constraint if exists external_catalog_sources_updated_by_fkey;
alter table public.external_catalog_sources add constraint external_catalog_sources_updated_by_fkey foreign key(updated_by) references public.profiles(id) on delete set null;
alter table public.external_catalog_sync_runs drop constraint if exists external_catalog_sync_runs_requested_by_fkey;
alter table public.external_catalog_sync_runs add constraint external_catalog_sync_runs_requested_by_fkey foreign key(requested_by) references public.profiles(id) on delete set null;
alter table public.external_catalog_quarantine drop constraint if exists external_catalog_quarantine_resolved_by_fkey;
alter table public.external_catalog_quarantine add constraint external_catalog_quarantine_resolved_by_fkey foreign key(resolved_by) references public.profiles(id) on delete set null;
alter table public.ugc_reports drop constraint if exists ugc_reports_reviewed_by_fkey;
alter table public.ugc_reports add constraint ugc_reports_reviewed_by_fkey foreign key(reviewed_by) references public.profiles(id) on delete set null;

do $$ declare v_table text; begin
  foreach v_table in array array['exercise_library','workout_templates','food_items','dishes','menu_templates'] loop
    execute format('alter table public.%I drop constraint if exists %I',v_table,v_table||'_moderated_by_fkey');
    execute format('alter table public.%I add constraint %I foreign key(moderated_by) references public.profiles(id) on delete set null',v_table,v_table||'_moderated_by_fkey');
  end loop;
end $$;

create or replace function public.begin_account_deletion(p_actor_hash text)
returns table(provider text,object_key text)
language plpgsql security definer set search_path=public,storage,pg_temp as $$
declare
  v_user uuid:=(select auth.uid());
  v_role text;
  v_auth_time bigint:=coalesce((auth.jwt()->>'auth_time')::bigint,0);
begin
  if v_user is null or extract(epoch from now())::bigint-v_auth_time>600 then
    raise exception 'Recent authentication is required';
  end if;
  if p_actor_hash is null or char_length(p_actor_hash)<>64 then raise exception 'Invalid deletion audit token';end if;
  select role::text into v_role from public.profiles where id=v_user for update;
  if v_role is null then raise exception 'Account not found';end if;
  update public.profiles set deletion_requested_at=now() where id=v_user;
  insert into public.account_deletion_audit(actor_hash,role,requested_at,retained_until,reason)
    values(p_actor_hash,v_role,now(),now()+interval '24 months','User-requested in-app account deletion');
  return query
    select 'r2'::text,f.object_key from public.private_files f where f.owner_id=v_user and f.status<>'deleted'
    union all
    select ('supabase:'||o.bucket_id)::text,o.name from storage.objects o where o.owner_id::text=v_user::text;
end $$;
revoke all on function public.begin_account_deletion(text) from public;
grant execute on function public.begin_account_deletion(text) to authenticated;

comment on table public.account_deletion_audit is 'Minimal pseudonymous deletion record retained for 24 months for fraud, security, and legal accountability.';
comment on table public.account_file_deletion_queue is 'Server-only queue for private objects that could not be deleted during account deletion.';
