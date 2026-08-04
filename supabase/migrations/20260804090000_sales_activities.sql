-- Sales Activities: log of sales touches (calls, follow-ups, emails, meetings,
-- demos, proposals) that the page displays, aggregates, and reports on.
create table if not exists public.sales_activities (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  type text not null default 'call',        -- call | followup | email | dm | meeting | demo | proposal
  contact_name text default '',
  contact_company text default '',
  title text default '',
  priority text default 'warm',              -- hot | warm | cold
  status text default 'open',                -- open | completed
  outcome text default '',                   -- '' | connected | no_answer | booked | won | lost | nurture
  estimated_value numeric default 0,
  occurred_on date default (now() at time zone 'utc')::date,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sales_activities_mpid_idx on public.sales_activities (master_plan_id);
alter table public.sales_activities enable row level security;

-- Optional weekly targets per activity type, powering the progress bars.
create table if not exists public.sales_goals (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  activity_type text not null,
  weekly_target int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists sales_goals_uniq on public.sales_goals (master_plan_id, activity_type);
alter table public.sales_goals enable row level security;
