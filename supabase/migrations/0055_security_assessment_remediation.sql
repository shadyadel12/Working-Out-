-- Security assessment remediation:
-- - require AAL2 for every direct administrator RLS policy
-- - atomically enforce private-upload issuance and byte quotas
-- - restrict support uploads to images/videos at the database boundary
-- - harden every public SECURITY DEFINER search path and schema privileges

drop policy if exists "admin full access on chat_messages" on public.chat_messages;
create policy "admin full access on chat_messages" on public.chat_messages
  for all to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

drop policy if exists "admin full access admin_messages" on public.admin_messages;
create policy "admin full access admin_messages" on public.admin_messages
  for all to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

drop policy if exists "support admin all" on storage.objects;
create policy "support admin all" on storage.objects
  for all to authenticated
  using (bucket_id = 'support' and public.auth_role() = 'admin')
  with check (bucket_id = 'support' and public.auth_role() = 'admin');

alter table public.private_files
  drop constraint if exists private_files_byte_size_check;

alter table public.private_files
  add constraint private_files_byte_size_check check (
    byte_size > 0
    and byte_size <= case
      when purpose = 'workout-video' then 524288000
      when purpose = 'chat-attachment' and content_type like 'video/%' then 524288000
      when purpose = 'chat-attachment' and content_type like 'image/%' then 10485760
      when purpose = 'chat-voice' then 26214400
      when purpose = 'support-attachment' and content_type like 'video/%' then 524288000
      when purpose = 'support-attachment' and content_type like 'image/%' then 10485760
      else 0
    end
  );

create index if not exists private_files_owner_quota_idx
  on public.private_files (owner_id, status, created_at desc);

create or replace function public.register_private_upload(
  p_id uuid,
  p_object_key text,
  p_owner_id uuid,
  p_coach_id uuid,
  p_player_id uuid,
  p_purpose text,
  p_original_name text,
  p_content_type text,
  p_byte_size bigint,
  p_attachment_type text
)
returns public.private_files
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.private_files;
  v_pending_count integer;
  v_hourly_count integer;
  v_daily_bytes bigint;
begin
  if p_owner_id is null or not exists (select 1 from public.profiles where id = p_owner_id) then
    raise exception 'Upload owner is invalid';
  end if;
  if p_id is null or p_object_key !~ ('^quarantine/' || p_purpose || '/' || p_id::text || '\.[A-Za-z0-9]{1,10}$') then
    raise exception 'Upload object key is invalid';
  end if;
  if p_original_name is null or char_length(p_original_name) not between 1 and 255 then
    raise exception 'Upload name is invalid';
  end if;
  if p_attachment_type not in ('image', 'video', 'audio') then
    raise exception 'Upload attachment type is invalid';
  end if;
  if not (
    (p_purpose = 'workout-video'
      and p_player_id is not null
      and p_content_type in ('video/mp4', 'video/webm', 'video/quicktime')
      and p_byte_size between 1 and 524288000)
    or (p_purpose = 'chat-attachment'
      and p_coach_id is not null and p_player_id is not null
      and ((p_content_type in ('image/jpeg', 'image/png', 'image/webp', 'image/gif') and p_byte_size between 1 and 10485760)
        or (p_content_type in ('video/mp4', 'video/webm', 'video/quicktime') and p_byte_size between 1 and 524288000)))
    or (p_purpose = 'chat-voice'
      and p_coach_id is not null and p_player_id is not null
      and p_content_type in ('audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm')
      and p_byte_size between 1 and 26214400)
    or (p_purpose = 'support-attachment'
      and p_coach_id is not null
      and ((p_content_type in ('image/jpeg', 'image/png', 'image/webp', 'image/gif') and p_byte_size between 1 and 10485760)
        or (p_content_type in ('video/mp4', 'video/webm', 'video/quicktime') and p_byte_size between 1 and 524288000)))
  ) then
    raise exception 'File type, context, or size is not allowed';
  end if;

  -- Serialize registrations for one owner so parallel requests cannot race quotas.
  perform pg_advisory_xact_lock(hashtextextended(p_owner_id::text, 0));

  select count(*) into v_pending_count
  from public.private_files
  where owner_id = p_owner_id and status in ('pending', 'quarantined');
  if v_pending_count >= 5 then
    raise exception 'Upload quota exceeded: finish or remove pending uploads first';
  end if;

  select count(*) into v_hourly_count
  from public.private_files
  where owner_id = p_owner_id
    and created_at >= now() - interval '1 hour'
    and status not in ('rejected', 'deleted');
  if v_hourly_count >= 20 then
    raise exception 'Upload quota exceeded: too many upload requests this hour';
  end if;

  select coalesce(sum(byte_size), 0) into v_daily_bytes
  from public.private_files
  where owner_id = p_owner_id
    and created_at >= now() - interval '24 hours'
    and status not in ('rejected', 'deleted');
  if v_daily_bytes + p_byte_size > 2147483648 then
    raise exception 'Upload quota exceeded: daily upload allowance reached';
  end if;

  insert into public.private_files (
    id, object_key, owner_id, coach_id, player_id, purpose, original_name,
    content_type, byte_size, attachment_type
  ) values (
    p_id, p_object_key, p_owner_id, p_coach_id, p_player_id, p_purpose,
    p_original_name, p_content_type, p_byte_size, p_attachment_type
  ) returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.register_private_upload(uuid,text,uuid,uuid,uuid,text,text,text,bigint,text) from public;
revoke all on function public.register_private_upload(uuid,text,uuid,uuid,uuid,text,text,text,bigint,text) from anon, authenticated;
grant execute on function public.register_private_upload(uuid,text,uuid,uuid,uuid,text,text,text,bigint,text) to service_role;

-- Authenticated application roles never need to create objects in public.
revoke create on schema public from public, anon, authenticated;

-- Existing functions retain public first because many bodies use unqualified
-- application objects; pg_temp is explicitly last to prevent temp shadowing.
do $$
declare
  v_function record;
begin
  for v_function in
    select n.nspname as schema_name, p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as identity_arguments
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = public, pg_temp',
      v_function.schema_name, v_function.function_name, v_function.identity_arguments
    );
  end loop;
end;
$$;
