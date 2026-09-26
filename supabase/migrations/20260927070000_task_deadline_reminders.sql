-- Deadline reminders for timed tasks: reminded_at stops a task being emailed
-- twice; the profile holds how far ahead to remind and whether to email.
alter table public.tasks add column if not exists reminded_at timestamptz;
create index if not exists tasks_reminder_idx on public.tasks (due_at) where due_has_time and reminded_at is null;

alter table public.profiles
  add column if not exists task_reminder_email boolean not null default true,
  add column if not exists task_reminder_lead_min integer not null default 30
    check (task_reminder_lead_min in (10, 15, 30, 60, 120));
