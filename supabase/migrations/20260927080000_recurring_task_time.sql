-- Recurring tasks can carry a time of day, either a deadline ('due by') or a
-- scheduled slot ('do it at'). reminders dedupes the once-a-day reminder.
alter table public.recurring_tasks
  add column if not exists time_of_day text check (time_of_day ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  add column if not exists time_kind text not null default 'deadline' check (time_kind in ('deadline', 'scheduled'));

create table if not exists public.recurring_task_reminders (
  recurring_task_id uuid not null references public.recurring_tasks(id) on delete cascade,
  remind_on date not null,
  sent_at timestamptz not null default now(),
  primary key (recurring_task_id, remind_on)
);
alter table public.recurring_task_reminders enable row level security;
