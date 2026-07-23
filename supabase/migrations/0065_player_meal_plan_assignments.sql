create table if not exists public.player_meal_plan_assignments(
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  menu_template_id uuid not null references public.menu_templates(id) on delete restrict,
  start_week integer not null check(start_week > 0),
  end_week integer not null check(end_week >= start_week),
  assigned_at timestamptz not null default now(),
  status text not null default 'active' check(status in('active','replaced','completed'))
);
create index if not exists player_meal_plan_assignment_player_idx on public.player_meal_plan_assignments(player_id,status,assigned_at desc);
alter table public.player_meal_plan_assignments enable row level security;
create policy player_meal_plan_assignments_read on public.player_meal_plan_assignments for select to authenticated
using(player_id=(select auth.uid()) or public.is_my_player(player_id));
create policy player_meal_plan_assignments_write on public.player_meal_plan_assignments for all to authenticated
using(public.is_my_player(player_id)) with check(public.is_my_player(player_id));

create or replace function public.apply_menu_template_to_player(p_player_id uuid,p_menu_template_id uuid,p_start_week int)
returns int language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner uuid:=coalesce(public.team_owner_for_member(),(select auth.uid()));v_week_count int;v_created int:=0;v_row record;
begin
 if p_start_week<1 then raise exception 'Starting week must be positive';end if;
 if not public.is_my_player(p_player_id) then raise exception 'Player access denied';end if;
 select week_count into v_week_count from public.menu_templates where id=p_menu_template_id and coach_id=v_owner and lifecycle='published' and deleted_at is null;
 if not found then raise exception 'Published meal plan not found';end if;
 delete from public.diet_days where player_id=p_player_id and week_number between p_start_week and p_start_week+v_week_count-1;
 update public.player_meal_plan_assignments set status='replaced' where player_id=p_player_id and status='active' and int4range(start_week,end_week,'[]')&&int4range(p_start_week,p_start_week+v_week_count-1,'[]');
 for v_row in select e.week_number,((e.day_number+5)%7)::int day_of_week,jsonb_agg(jsonb_build_object(
  'type',e.meal_type,'label',e.meal_name,'content',coalesce(e.note,''),
  'items',coalesce((select jsonb_agg(jsonb_build_object('food',f.name,'grams',case when lower(c.unit) in('g','gram','grams') then c.quantity::text else '' end,'unit',case when lower(c.unit) in('g','gram','grams') then 'grams' else 'quantity' end,'quantity',case when lower(c.unit) in('g','gram','grams') then '' else c.quantity::text end,'quantityUnit',case when lower(c.unit) in('g','gram','grams') then null else c.unit end) order by c.position) from public.dish_components c join public.food_items f on f.id=c.food_item_id where c.dish_id=e.dish_id),'[]'::jsonb),
  'recipe',case when d.id is null then null else jsonb_build_object('id',d.id,'title',d.title,'servings',d.servings,'instructions',d.instructions,'videoUrl',d.instruction_video_url,'preparationSteps',d.preparation_steps,'cookingSteps',d.cooking_steps,'nutrition',jsonb_build_object('calories',d.calories,'protein',d.protein_g,'carbs',d.carbs_g,'fat',d.fat_g),'dietaryLabels',d.dietary_labels,'ingredients',coalesce((select jsonb_agg(jsonb_build_object('food',f.name,'quantity',c.quantity::text,'unit',c.unit) order by c.position) from public.dish_components c join public.food_items f on f.id=c.food_item_id where c.dish_id=d.id),'[]'::jsonb)) end) order by e.position) meals
 from public.menu_entries e left join public.dishes d on d.id=e.dish_id where e.menu_template_id=p_menu_template_id group by e.week_number,e.day_number
 loop insert into public.diet_days(player_id,coach_id,week_number,day_of_week,meals,comment,is_template_override,updated_at) values(p_player_id,v_owner,p_start_week+v_row.week_number-1,v_row.day_of_week,v_row.meals,null,true,now());v_created:=v_created+1;end loop;
 if v_created=0 then raise exception 'Meal plan has no scheduled meals';end if;
 insert into public.player_meal_plan_assignments(coach_id,player_id,menu_template_id,start_week,end_week) values(v_owner,p_player_id,p_menu_template_id,p_start_week,p_start_week+v_week_count-1);
 return v_created;
end $$;
revoke all on function public.apply_menu_template_to_player(uuid,uuid,int) from public;
grant execute on function public.apply_menu_template_to_player(uuid,uuid,int) to authenticated;
