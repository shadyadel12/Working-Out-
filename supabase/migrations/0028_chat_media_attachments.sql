-- Private image, video, and audio attachments for coach/player chat.
alter table public.chat_messages
  add column if not exists attachment_path text,
  add column if not exists attachment_type text;

alter table public.chat_messages alter column body set default '';
alter table public.chat_messages drop constraint if exists chat_messages_body_check;
alter table public.chat_messages drop constraint if exists chat_messages_body_length;
alter table public.chat_messages add constraint chat_messages_content_check check (
  char_length(body) <= 5000
  and (char_length(trim(body)) > 0 or attachment_path is not null)
  and (attachment_path is null) = (attachment_type is null)
  and (attachment_path is null or char_length(attachment_path) <= 1024)
  and (attachment_type is null or attachment_type in ('image', 'video', 'audio'))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments', 'chat-attachments', false, 52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy chat_attachment_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'chat-attachments'
  and (storage.foldername(name))[3] = (select auth.uid())::text
  and exists (
    select 1 from public.coach_player_links l
    where l.coach_id::text = (storage.foldername(name))[1]
      and l.player_id::text = (storage.foldername(name))[2]
      and l.status = 'active'
      and l.subscription_end_date >= current_date
      and ((select auth.uid()) = l.coach_id or (select auth.uid()) = l.player_id)
  )
);

create policy chat_attachment_read on storage.objects for select to authenticated
using (
  bucket_id = 'chat-attachments'
  and exists (
    select 1 from public.coach_player_links l
    where l.coach_id::text = (storage.foldername(name))[1]
      and l.player_id::text = (storage.foldername(name))[2]
      and l.status = 'active'
      and l.subscription_end_date >= current_date
      and ((select auth.uid()) = l.coach_id or (select auth.uid()) = l.player_id)
  )
);

create policy chat_attachment_sender_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'chat-attachments'
  and (storage.foldername(name))[3] = (select auth.uid())::text
);
