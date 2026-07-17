-- Required for Supabase Realtime to deliver INSERT events across RLS boundaries.
-- Without this, admin messages don't appear in real-time on the coach's side.
alter table public.admin_messages replica identity full;

-- Realtime only emits changes for tables in the supabase_realtime publication.
-- Without this, no postgres_changes events fire and clients must reload to see messages.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'admin_messages'
  ) then
    alter publication supabase_realtime add table public.admin_messages;
  end if;
end $$;
