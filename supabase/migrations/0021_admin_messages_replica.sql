-- Required for Supabase Realtime to deliver INSERT events across RLS boundaries.
-- Without this, admin messages don't appear in real-time on the coach's side.
alter table public.admin_messages replica identity full;
