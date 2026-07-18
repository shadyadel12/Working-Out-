-- Extra planning context shown beside the program builder.
alter table public.player_coaching_profiles
  add column if not exists limitations_injuries text not null default '' check (char_length(limitations_injuries) <= 10000),
  add column if not exists available_equipment text not null default '' check (char_length(available_equipment) <= 10000);
