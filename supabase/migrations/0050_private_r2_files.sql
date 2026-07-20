-- Private Cloudflare R2 object registry. R2 credentials stay exclusively in
-- Edge Function secrets; application clients store only opaque r2:<uuid> refs.
create table if not exists public.private_files (
  id uuid primary key default gen_random_uuid(),
  object_key text not null unique,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete cascade,
  purpose text not null check (purpose in ('workout-video', 'chat-attachment', 'support-attachment')),
  status text not null default 'pending' check (status in ('pending', 'quarantined', 'ready', 'deleted', 'rejected')),
  original_name text not null check (char_length(original_name) between 1 and 255),
  content_type text not null check (char_length(content_type) between 1 and 150),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 52428800),
  attachment_type text check (attachment_type is null or attachment_type in ('image', 'video', 'audio', 'file')),
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  deleted_at timestamptz,
  constraint private_files_context check (
    (purpose = 'workout-video' and player_id is not null)
    or (purpose = 'chat-attachment' and coach_id is not null and player_id is not null)
    or (purpose = 'support-attachment' and coach_id is not null)
  )
);

create index if not exists private_files_owner_idx on public.private_files (owner_id, created_at desc);
create index if not exists private_files_player_idx on public.private_files (player_id, created_at desc) where player_id is not null;
create index if not exists private_files_pending_idx on public.private_files (created_at) where status in ('pending', 'quarantined');

alter table public.private_files enable row level security;

-- No client policies are intentional. The service-role Edge Functions validate
-- the caller and relationship context before reading or mutating metadata.
revoke all on table public.private_files from anon, authenticated;
