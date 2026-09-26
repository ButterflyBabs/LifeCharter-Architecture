-- Recurring tasks for the dashboard's Priority Tasks card. A task recurs daily,
-- on chosen weekdays, or on a day of the month; each day it is due it can be
-- checked off (one completion row per task per date).
create table if not exists public.recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  title text not null,
  priority text not null default 'medium',
  cadence text not null check (cadence in ('daily', 'weekly', 'monthly')),
  days_of_week smallint[],            -- weekly: 0 = Sunday … 6 = Saturday
  day_of_month smallint check (day_of_month between 1 and 31),  -- monthly (short months use the last day)
  created_at timestamptz not null default now()
);
create index if not exists recurring_tasks_plan_idx on public.recurring_tasks (master_plan_id);
alter table public.recurring_tasks enable row level security;

create table if not exists public.recurring_task_completions (
  recurring_task_id uuid not null references public.recurring_tasks(id) on delete cascade,
  done_on date not null,
  completed_at timestamptz not null default now(),
  primary key (recurring_task_id, done_on)
);
alter table public.recurring_task_completions enable row level security;
