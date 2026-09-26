-- due_at is the task's due instant. due_has_time says whether its time of day
-- is meaningful (false = a date-only task, stored as the end of that day).
-- time_kind: 'deadline' = must be done by this time; 'scheduled' = set aside to
-- do at this time (shows on the day's schedule).
alter table public.tasks
  add column if not exists due_has_time boolean not null default false,
  add column if not exists time_kind text not null default 'deadline' check (time_kind in ('deadline', 'scheduled'));
update public.tasks set due_has_time = true where due_at is not null;
