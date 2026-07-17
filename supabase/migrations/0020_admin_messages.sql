-- Support chat between coaches and the admin team.
-- Supports text messages and file attachments (images, videos, files).
create table public.admin_messages (
  id              uuid        primary key default gen_random_uuid(),
  coach_id        uuid        not null references public.profiles(id) on delete cascade,
  sender_id       uuid        not null references public.profiles(id) on delete cascade,
  body            text        not null default '',
  attachment_path text,           -- storage path: support/{coach_id}/{filename}
  attachment_type text,           -- 'image' | 'video' | 'file'
  created_at      timestamptz not null default now(),
  -- must have body OR attachment
  constraint admin_messages_has_content check (
    char_length(trim(body)) > 0 or attachment_path is not null
  )
);

create index on public.admin_messages (coach_id, created_at);

alter table public.admin_messages enable row level security;

-- Admin: full access to all threads
create policy "admin full access admin_messages" on public.admin_messages
  for all to authenticated
  using  ((select role from public.profiles where id = (select auth.uid())) = 'admin')
  with check ((select role from public.profiles where id = (select auth.uid())) = 'admin');

-- Coach: read their own thread
create policy "coach read own admin_messages" on public.admin_messages
  for select to authenticated
  using (coach_id = (select auth.uid()));

-- Coach: send to their own thread only
create policy "coach send admin_messages" on public.admin_messages
  for insert to authenticated
  with check (
    coach_id  = (select auth.uid()) and
    sender_id = (select auth.uid()) and
    (select role from public.profiles where id = (select auth.uid())) = 'coach'
  );

-- Storage bucket for support attachments (created via dashboard or CLI,
-- but we add the RLS policies here so they are in source control).
-- Bucket name: support  (private)
insert into storage.buckets (id, name, public)
  values ('support', 'support', false)
  on conflict (id) do nothing;

-- Coach uploads only to their own folder
create policy "support coach upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'support' and
    (select role from public.profiles where id = (select auth.uid())) = 'coach' and
    (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Coach reads their own folder
create policy "support coach read own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'support' and
    (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Admin reads / manages everything in support bucket
create policy "support admin all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'support' and
    (select role from public.profiles where id = (select auth.uid())) = 'admin'
  )
  with check (
    bucket_id = 'support' and
    (select role from public.profiles where id = (select auth.uid())) = 'admin'
  );
