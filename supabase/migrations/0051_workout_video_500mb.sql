-- Workout evidence videos may be up to 500 MiB. Other private-file purposes
-- retain the existing 50 MiB database ceiling and their stricter function caps.
alter table public.private_files
  drop constraint if exists private_files_byte_size_check;

alter table public.private_files
  add constraint private_files_byte_size_check check (
    byte_size > 0
    and byte_size <= case
      when purpose = 'workout-video' then 524288000
      else 52428800
    end
  );
