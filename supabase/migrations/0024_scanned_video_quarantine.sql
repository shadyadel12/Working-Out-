-- Videos enter a private quarantine bucket. Only the scan-video Edge Function
-- (service role) may copy clean files into the final videos bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'video-quarantine', 'video-quarantine', false, 52428800,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists videos_player_write on storage.objects;
drop policy if exists videos_coach_write on storage.objects;

create policy quarantine_player_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'video-quarantine'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );

create policy quarantine_coach_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'video-quarantine'
    and public.auth_role() = 'coach'
    and public.is_my_player(((storage.foldername(name))[1])::uuid)
  );

create policy quarantine_player_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'video-quarantine'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy quarantine_coach_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'video-quarantine'
    and public.auth_role() = 'coach'
    and public.is_my_player(((storage.foldername(name))[1])::uuid)
  );

