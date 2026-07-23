create table if not exists public.assignment_photos (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.scheduled_coaching_items(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique(assignment_id,storage_path)
);
alter table public.assignment_photos enable row level security;
create policy assignment_photos_read on public.assignment_photos for select to authenticated using(
  player_id=(select auth.uid()) or coach_id=(select auth.uid()) or public.team_can_view_player(coach_id,player_id)
);

drop policy if exists progress_photos_storage_read on storage.objects;
create policy progress_photos_storage_read on storage.objects for select to authenticated using (
  bucket_id='progress-photos' and (
    exists(select 1 from public.assignment_photos p where p.storage_path=name and (p.player_id=(select auth.uid()) or p.coach_id=(select auth.uid()) or public.team_can_view_player(p.coach_id,p.player_id))) or
    exists(select 1 from public.progress_photos p where p.storage_path=name and (p.player_id=(select auth.uid()) or p.coach_id=(select auth.uid()) or public.team_can_view_player(p.coach_id,p.player_id)))
  )
);

create or replace function public.submit_assignment_progress_photos(p_assignment_id uuid,p_paths text[])
returns void language plpgsql security definer set search_path=public,storage,pg_temp as $$
declare v_assignment public.scheduled_coaching_items; v_path text;
begin
  select * into v_assignment from public.scheduled_coaching_items where id=p_assignment_id and player_id=(select auth.uid()) and item_type='task' and status in('scheduled','active','complete');
  if not found then raise exception 'Assignment not found or access denied'; end if;
  if coalesce(v_assignment.snapshot->>'task_type','')<>'progress_photo' then raise exception 'This task does not accept photos'; end if;
  foreach v_path in array p_paths loop
    if split_part(v_path,'/',1)<>(select auth.uid())::text or not exists(select 1 from storage.objects where bucket_id='progress-photos' and name=v_path) then raise exception 'Invalid photo'; end if;
    insert into public.assignment_photos(assignment_id,player_id,coach_id,storage_path) values(v_assignment.id,v_assignment.player_id,v_assignment.coach_id,v_path) on conflict(assignment_id,storage_path) do nothing;
    if coalesce((v_assignment.snapshot->>'add_uploads_to_progress_photos')::boolean,false) then
      insert into public.progress_photos(player_id,coach_id,assignment_id,storage_path,captured_at) values(v_assignment.player_id,v_assignment.coach_id,v_assignment.id,v_path,now()) on conflict(assignment_id,storage_path) do nothing;
    end if;
  end loop;
  update public.scheduled_coaching_items set status='complete',completed_at=coalesce(completed_at,now()) where id=v_assignment.id;
end $$;
