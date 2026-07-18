-- Weekly check-up schedule. Existing players keep daily visibility until renewed.
alter table public.coach_player_links
  add column if not exists checkup_days_per_week int not null default 7 check (checkup_days_per_week between 1 and 7),
  add column if not exists checkup_weekdays int[] not null default '{0,1,2,3,4,5,6}';

create or replace function public.checkup_weekdays_for_count(p_count int) returns int[]
language sql immutable as $$
  select case p_count when 1 then array[1] when 2 then array[1,4] else array[1,3,5] end
$$;

create or replace function public.coach_create_unclaimed_key(p_end_date date,p_is_vip boolean default false,p_checkup_days int default 3) returns public.coach_player_links language plpgsql security definer set search_path=public as $$
declare v_key text;v_link coach_player_links;v_days int:=case when p_is_vip then 7 else least(greatest(p_checkup_days,1),3) end;v_weekdays int[];
begin if auth_role()<>'coach' then raise exception 'Access denied';end if;if p_end_date<=current_date then raise exception 'End date must be in the future';end if;v_weekdays:=case when p_is_vip then array[0,1,2,3,4,5,6] else checkup_weekdays_for_count(v_days) end;v_key:=upper(substring(replace(gen_random_uuid()::text,'-',''),1,20));insert into coach_player_links(coach_id,player_id,subscription_key,subscription_end_date,status,is_vip,checkup_days_per_week,checkup_weekdays)values((select auth.uid()),null,v_key,p_end_date,'active',p_is_vip,v_days,v_weekdays)returning * into v_link;return v_link;end$$;

create or replace function public.coach_create_player_key(p_player_id uuid,p_end_date date,p_is_vip boolean default false,p_checkup_days int default 3) returns public.coach_player_links language plpgsql security definer set search_path=public as $$
declare v_key text;v_link coach_player_links;v_days int:=case when p_is_vip then 7 else least(greatest(p_checkup_days,1),3) end;v_weekdays int[];
begin if auth_role()<>'coach' then raise exception 'Access denied';end if;if p_end_date<=current_date then raise exception 'End date must be in the future';end if;v_weekdays:=case when p_is_vip then array[0,1,2,3,4,5,6] else checkup_weekdays_for_count(v_days) end;v_key:=upper(substring(replace(gen_random_uuid()::text,'-',''),1,20));insert into coach_player_links(coach_id,player_id,subscription_key,subscription_end_date,status,is_vip,checkup_days_per_week,checkup_weekdays)values((select auth.uid()),p_player_id,v_key,p_end_date,'active',p_is_vip,v_days,v_weekdays)on conflict(coach_id,player_id)do update set subscription_key=v_key,subscription_end_date=p_end_date,status='active',is_vip=p_is_vip,checkup_days_per_week=v_days,checkup_weekdays=v_weekdays returning * into v_link;return v_link;end$$;

grant execute on function public.coach_create_unclaimed_key(date,boolean,int) to authenticated;
grant execute on function public.coach_create_player_key(uuid,date,boolean,int) to authenticated;
