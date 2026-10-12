-- Reminders: one-off things a client types in, with the moment they should be reminded ("LinkedIn Premium free trial
-- ends in 24 hours: renew or cancel before being charged"). Separate from Tasks. They appear on the Reminders page,
-- on Executive Home and Daily Compass, and in the notification bell; a reminder that comes due is also emailed once.
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  title text not null,
  notes text,
  remind_at timestamptz not null,
  status text not null default 'open' check (status in ('open','done')),
  done_at timestamptz,
  notified_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reminders_plan_status_at on reminders (master_plan_id, status, remind_at);
alter table reminders enable row level security;
