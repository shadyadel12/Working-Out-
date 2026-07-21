-- Ordinary chat attachments are photos or videos only. Voice recordings use a
-- separate purpose, while chat videos may be up to 500 MiB.
alter table public.private_files
  drop constraint if exists private_files_purpose_check;

alter table public.private_files
  add constraint private_files_purpose_check check (
    purpose in ('workout-video', 'chat-attachment', 'chat-voice', 'support-attachment')
  );

alter table public.private_files
  drop constraint if exists private_files_context;

alter table public.private_files
  add constraint private_files_context check (
    (purpose = 'workout-video' and player_id is not null)
    or (purpose in ('chat-attachment', 'chat-voice') and coach_id is not null and player_id is not null)
    or (purpose = 'support-attachment' and coach_id is not null)
  );

-- Preserve voice messages uploaded before the purposes were separated.
update public.private_files
set purpose = 'chat-voice'
where purpose = 'chat-attachment'
  and content_type like 'audio/%';

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
      when purpose = 'support-attachment' then 26214400
      else 0
    end
  );
