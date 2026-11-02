-- Work Log: part-time and virtual team members clock in, list each thing they did (what, how many, how long),
-- note challenges and help asked for / received, clock out and submit the day. The account owner reviews and approves.
create table if not exists public.work_shifts (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  person_email text not null,
  person_name text,
  clock_in timestamptz not null default now(),
  clock_out timestamptz,                  -- null = still clocked in
  status text not null default 'open' check (status in ('open', 'submitted', 'approved', 'returned')),
  summary text,                           -- the person's note about the day
  hourly_rate numeric(10,2),              -- copied from work_log_rates at clock-in; seen by the owner only
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists work_shifts_plan_idx on public.work_shifts (master_plan_id, clock_in desc);
create unique index if not exists work_shifts_one_clocked_in on public.work_shifts (master_plan_id, person_email) where clock_out is null;
alter table public.work_shifts enable row level security;

create table if not exists public.work_log_items (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.work_shifts(id) on delete cascade,
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  what text not null,                     -- the specific task or activity
  quantity numeric(10,2),                 -- how many (25 DMs, 3 posts)
  unit text,                              -- what was counted
  minutes integer check (minutes is null or minutes >= 0),
  task_id bigint references public.tasks(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  challenge text,                         -- what got in the way
  help_asked_of text,                     -- who they asked for help
  help_received_from text,                -- who actually helped
  help_note text,                         -- what the help was about / what they got
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists work_log_items_shift_idx on public.work_log_items (shift_id, created_at);
create index if not exists work_log_items_plan_idx on public.work_log_items (master_plan_id, created_at desc);
alter table public.work_log_items enable row level security;

create table if not exists public.work_log_rates (
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  person_email text not null,
  hourly_rate numeric(10,2) not null check (hourly_rate >= 0),
  updated_at timestamptz not null default now(),
  primary key (master_plan_id, person_email)
);
alter table public.work_log_rates enable row level security;

comment on table public.work_shifts is 'Work Log: one clock-in to clock-out per person; reviewed by the account owner.';
comment on table public.work_log_items is 'Work Log: each activity done in a shift, with challenges and help.';
comment on table public.work_log_rates is 'Work Log: hourly rate per team member, visible to the account owner only.';
