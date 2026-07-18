-- Input and upload boundary hardening. NOT VALID keeps deployment compatible
-- with legacy rows while enforcing constraints for all new/changed rows.

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime']
where id = 'videos';

update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
where id = 'support';

alter table public.profiles add constraint profiles_name_length
  check (name is null or char_length(name) between 1 and 200) not valid;
alter table public.program_days add constraint program_days_text_length
  check (
    (title is null or char_length(title) <= 200)
    and (diet_plan is null or char_length(diet_plan) <= 10000)
    and week_number <= 520
  ) not valid;
alter table public.workouts add constraint workouts_name_length
  check (char_length(name) between 1 and 200) not valid;
alter table public.exercises add constraint exercises_text_length
  check (
    char_length(name) between 1 and 200
    and (target_reps is null or char_length(target_reps) <= 100)
    and (target_weight is null or char_length(target_weight) <= 100)
    and (coach_comment is null or char_length(coach_comment) <= 5000)
    and (coach_video_url is null or char_length(coach_video_url) <= 2048)
    and (
      not coach_video_is_external
      or (
        coach_video_url ~* '^https?://'
        and coach_video_url !~* '^https?://(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1)'
      )
    )
  ) not valid;
alter table public.exercise_logs add constraint exercise_logs_text_length
  check (
    (actual_reps is null or char_length(actual_reps) <= 500)
    and (actual_weight is null or char_length(actual_weight) <= 500)
    and (player_comment is null or char_length(player_comment) <= 5000)
    and (player_video_url is null or char_length(player_video_url) <= 2048)
    and (
      not player_video_is_external
      or (
        player_video_url ~* '^https?://'
        and player_video_url !~* '^https?://(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1)'
      )
    )
  ) not valid;
alter table public.messages add constraint messages_body_length
  check (char_length(body) between 1 and 5000) not valid;
alter table public.diet_days add constraint diet_days_content_length
  check (
    week_number <= 520
    and octet_length(meals::text) <= 1048576
    and (comment is null or char_length(comment) <= 5000)
  ) not valid;
alter table public.coach_foods add constraint coach_foods_name_length
  check (char_length(name) between 1 and 200) not valid;

-- Hide database details from anonymous callers and tighten RPC exposure.
revoke all on function public.check_coach_key(text) from public;
revoke all on function public.check_subscription_key(text) from public;
grant execute on function public.check_coach_key(text) to anon, authenticated;
grant execute on function public.check_subscription_key(text) to anon, authenticated;
