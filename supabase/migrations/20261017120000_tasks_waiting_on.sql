-- Waiting list: who or what a task is waiting on, since when, and the day to check back.
alter table public.tasks add column if not exists waiting_on text;
alter table public.tasks add column if not exists waiting_since timestamptz;
alter table public.tasks add column if not exists check_back_on date;
