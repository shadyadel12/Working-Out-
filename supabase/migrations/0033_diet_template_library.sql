-- Reusable diet-day library with player-specific overrides.
create table if not exists public.diet_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  meals jsonb not null default '[]',
  comment text,
  created_at timestamptz not null default now()
);
create unique index if not exists diet_templates_coach_name_idx on public.diet_templates(coach_id,lower(name));
alter table public.diet_days add column if not exists template_id uuid references public.diet_templates(id) on delete restrict;
alter table public.diet_days add column if not exists is_template_override boolean not null default true;

alter table public.diet_templates enable row level security;
drop policy if exists diet_templates_coach_all on public.diet_templates;
drop policy if exists diet_templates_player_read on public.diet_templates;
create policy diet_templates_coach_all on public.diet_templates for all to authenticated
using(coach_id=(select auth.uid())) with check(coach_id=(select auth.uid()) and public.auth_role()='coach');
create policy diet_templates_player_read on public.diet_templates for select to authenticated using(exists(
  select 1 from diet_days d where d.template_id=diet_templates.id and d.player_id=(select auth.uid())
));

create or replace function public.save_diet_as_template(p_diet_day_id uuid,p_name text) returns uuid
language plpgsql security invoker set search_path=public as $$
declare v_day diet_days; v_template uuid;
begin
  if char_length(trim(p_name)) not between 1 and 200 then raise exception 'Enter a template name'; end if;
  select * into v_day from diet_days where id=p_diet_day_id and coach_id=(select auth.uid());
  if not found then raise exception 'Diet day not found or access denied'; end if;
  if v_day.template_id is not null then return v_day.template_id; end if;
  select id into v_template from diet_templates where coach_id=(select auth.uid()) and lower(name)=lower(trim(p_name));
  if v_template is not null then return v_template; end if;
  insert into diet_templates(coach_id,name,meals,comment) values((select auth.uid()),trim(p_name),v_day.meals,v_day.comment) returning id into v_template;
  return v_template;
end $$;

create or replace function public.assign_diet_template(p_player_id uuid,p_week int,p_day_of_week int,p_template_id uuid) returns uuid
language plpgsql security invoker set search_path=public as $$
declare v_day uuid;
begin
  if p_week<1 or p_day_of_week not between 0 and 6 or not is_my_player(p_player_id)
     or not exists(select 1 from diet_templates where id=p_template_id and coach_id=(select auth.uid())) then raise exception 'Access denied or invalid diet day'; end if;
  insert into diet_days(player_id,coach_id,week_number,day_of_week,meals,comment,template_id,is_template_override)
  values(p_player_id,(select auth.uid()),p_week,p_day_of_week,'[]',null,p_template_id,false)
  on conflict(player_id,week_number,day_of_week) do update set coach_id=excluded.coach_id,meals='[]',comment=null,template_id=excluded.template_id,is_template_override=false,updated_at=now()
  returning id into v_day;
  return v_day;
end $$;

revoke all on function public.save_diet_as_template(uuid,text) from public;
revoke all on function public.assign_diet_template(uuid,int,int,uuid) from public;
grant execute on function public.save_diet_as_template(uuid,text) to authenticated;
grant execute on function public.assign_diet_template(uuid,int,int,uuid) to authenticated;
