alter table public.coaching_tasks
  add column if not exists add_uploads_to_progress_photos boolean not null default false;

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid not null references public.scheduled_coaching_items(id) on delete cascade,
  storage_path text not null,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (assignment_id, storage_path)
);
create index if not exists progress_photos_player_date_idx on public.progress_photos(player_id,captured_at desc);
alter table public.progress_photos enable row level security;

create policy progress_photos_read on public.progress_photos for select to authenticated using (
  player_id=(select auth.uid()) or coach_id=(select auth.uid()) or
  public.team_can_view_player(coach_id,player_id)
);
create policy progress_photos_player_insert on public.progress_photos for insert to authenticated with check (
  player_id=(select auth.uid()) and exists(
    select 1 from public.scheduled_coaching_items a
    where a.id=assignment_id and a.player_id=(select auth.uid()) and a.coach_id=coach_id
      and a.item_type='task' and coalesce((a.snapshot->>'add_uploads_to_progress_photos')::boolean,false)
  )
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('progress-photos','progress-photos',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy progress_photos_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id='progress-photos' and (storage.foldername(name))[1]=(select auth.uid())::text
);
create policy progress_photos_storage_read on storage.objects for select to authenticated using (
  bucket_id='progress-photos' and exists(
    select 1 from public.progress_photos p where p.storage_path=name and
    (p.player_id=(select auth.uid()) or p.coach_id=(select auth.uid()) or public.team_can_view_player(p.coach_id,p.player_id))
  )
);

create or replace function public.submit_assignment_progress_photos(p_assignment_id uuid,p_paths text[])
returns void language plpgsql security definer set search_path=public,storage,pg_temp as $$
declare v_assignment public.scheduled_coaching_items; v_path text;
begin
  select * into v_assignment from public.scheduled_coaching_items
  where id=p_assignment_id and player_id=(select auth.uid()) and item_type='task' and status in('scheduled','active','complete');
  if not found then raise exception 'Assignment not found or access denied'; end if;
  if coalesce(v_assignment.snapshot->>'task_type','')<>'progress_photo' then raise exception 'This task does not accept photos'; end if;
  foreach v_path in array p_paths loop
    if split_part(v_path,'/',1)<>(select auth.uid())::text or not exists(select 1 from storage.objects where bucket_id='progress-photos' and name=v_path) then raise exception 'Invalid photo'; end if;
    if coalesce((v_assignment.snapshot->>'add_uploads_to_progress_photos')::boolean,false) then
      insert into public.progress_photos(player_id,coach_id,assignment_id,storage_path,captured_at)
      values(v_assignment.player_id,v_assignment.coach_id,v_assignment.id,v_path,now()) on conflict(assignment_id,storage_path) do nothing;
    end if;
  end loop;
  update public.scheduled_coaching_items set status='complete',completed_at=coalesce(completed_at,now()) where id=v_assignment.id;
end $$;
revoke all on function public.submit_assignment_progress_photos(uuid,text[]) from public;
grant execute on function public.submit_assignment_progress_photos(uuid,text[]) to authenticated;
