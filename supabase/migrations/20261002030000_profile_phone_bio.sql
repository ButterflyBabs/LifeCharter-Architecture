-- Settings > Profile: phone and bio are now saved (the fields existed on screen only).
alter table public.profiles add column if not exists phone text, add column if not exists bio text;
