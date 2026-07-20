-- Let linked coaches see player workout confirmations without refreshing.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'exercise_logs'
  ) then
    alter publication supabase_realtime add table public.exercise_logs;
  end if;
end $$;
