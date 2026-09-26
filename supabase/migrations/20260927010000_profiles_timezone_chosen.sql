-- profiles.timezone defaults to America/Denver, so on its own it can't tell an
-- explicit choice from the default. This flag is set when the user picks one.
alter table public.profiles add column if not exists timezone_chosen boolean not null default false;
