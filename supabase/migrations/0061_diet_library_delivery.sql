alter table public.menu_entries
  add column if not exists meal_type text not null default 'meal'
  check (meal_type in ('meal','snack'));

create or replace function public.apply_menu_template_to_player(
  p_player_id uuid,
  p_menu_template_id uuid,
  p_start_week int
) returns int
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_owner uuid := coalesce(public.team_owner_for_member(), (select auth.uid()));
  v_week_count int;
  v_created int := 0;
  v_row record;
begin
  if p_start_week < 1 then raise exception 'Starting week must be positive'; end if;
  if not public.is_my_player(p_player_id) then raise exception 'Player access denied'; end if;

  select week_count into v_week_count
  from public.menu_templates
  where id=p_menu_template_id and coach_id=v_owner and lifecycle='published' and deleted_at is null;
  if not found then raise exception 'Published meal plan not found'; end if;

  delete from public.diet_days
  where player_id=p_player_id
    and week_number between p_start_week and p_start_week+v_week_count-1;

  for v_row in
    select
      e.week_number,
      ((e.day_number+5)%7)::int as day_of_week,
      jsonb_agg(
        jsonb_build_object(
          'type',e.meal_type,
          'label',e.meal_name,
          'content',coalesce(e.note,''),
          'items',coalesce((
            select jsonb_agg(jsonb_build_object(
              'food',f.name,
              'grams',case when lower(c.unit) in ('g','gram','grams') then c.quantity::text else '' end,
              'unit',case when lower(c.unit) in ('g','gram','grams') then 'grams' else 'quantity' end,
              'quantity',case when lower(c.unit) in ('g','gram','grams') then '' else c.quantity::text end,
              'quantityUnit',case when lower(c.unit) in ('g','gram','grams') then null else c.unit end
            ) order by c.position)
            from public.dish_components c join public.food_items f on f.id=c.food_item_id
            where c.dish_id=e.dish_id
          ),'[]'::jsonb),
          'recipe',case when d.id is null then null else jsonb_build_object(
            'id',d.id,'title',d.title,'servings',d.servings,'instructions',d.instructions,
            'ingredients',coalesce((
              select jsonb_agg(jsonb_build_object('food',f.name,'quantity',c.quantity::text,'unit',c.unit) order by c.position)
              from public.dish_components c join public.food_items f on f.id=c.food_item_id
              where c.dish_id=d.id
            ),'[]'::jsonb)
          ) end
        ) order by e.position
      ) as meals
    from public.menu_entries e
    left join public.dishes d on d.id=e.dish_id
    where e.menu_template_id=p_menu_template_id
    group by e.week_number,e.day_number
  loop
    insert into public.diet_days(player_id,coach_id,week_number,day_of_week,meals,comment,is_template_override,updated_at)
    values(p_player_id,v_owner,p_start_week+v_row.week_number-1,v_row.day_of_week,v_row.meals,null,true,now());
    v_created := v_created+1;
  end loop;
  if v_created=0 then raise exception 'Meal plan has no scheduled meals'; end if;
  return v_created;
end $$;

revoke all on function public.apply_menu_template_to_player(uuid,uuid,int) from public;
grant execute on function public.apply_menu_template_to_player(uuid,uuid,int) to authenticated;
