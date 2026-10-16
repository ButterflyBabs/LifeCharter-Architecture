-- Embraced;Fully (E:F) task list: a page only Babs sees (Alignment Architect), kept in its own table so these tasks can
-- never show up in the Tasks page, Projects, the assistant or any team member's view. Server-side access only.
create table if not exists public.ef_tasks (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  title text not null,
  notes text,
  status text not null default 'today' check (status in ('today','in_progress','waiting','backlog','done')),
  priority text not null default 'medium' check (priority in ('critical','high','medium','low')),
  due_date date,
  today_on date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ef_tasks_plan_idx on public.ef_tasks (master_plan_id, status);
alter table public.ef_tasks enable row level security;
