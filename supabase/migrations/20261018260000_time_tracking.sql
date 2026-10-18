-- Time tracking and capacity (task 1154): a timer (one running per person) or hand-entered time, tied to a client,
-- project or task, billable with an hourly rate; weekly capacity target and default / per-client rates per account.
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  person_email text not null,
  contact_id uuid references public.seq_contacts(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  task_id bigint references public.tasks(id) on delete set null,
  note text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,                   -- null = the timer is running
  billable boolean not null default true,
  rate numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists time_entries_plan_idx on public.time_entries (master_plan_id, started_at desc);
create unique index if not exists time_entries_one_running on public.time_entries (master_plan_id, person_email) where ended_at is null;
alter table public.time_entries enable row level security;
create table if not exists public.time_settings (
  master_plan_id uuid primary key references public.client_master_plans(id) on delete cascade,
  weekly_capacity_hours numeric(5,1) not null default 30,
  default_rate numeric(10,2),
  client_rates jsonb not null default '{}'::jsonb,   -- { contactId: rate }
  updated_at timestamptz not null default now()
);
alter table public.time_settings enable row level security;
