-- Weekly Meta Ads report: one row per ad per reporting period (from the file exported from Ads Manager), the account's own
-- goals and answers to the guided questions, and a saved snapshot of each weekly report.
create table if not exists public.meta_ad_stats (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  ad_name text not null,
  campaign_name text,
  period_start date not null,
  period_end date not null,
  spend numeric not null default 0,
  impressions integer not null default 0,
  reach integer,
  link_clicks integer not null default 0,
  leads integer not null default 0,
  frequency numeric,
  delivery text,
  source text not null default 'upload',
  created_at timestamptz not null default now(),
  unique (master_plan_id, ad_name, period_start, period_end)
);
create index if not exists meta_ad_stats_plan_period on public.meta_ad_stats (master_plan_id, period_end desc);

create table if not exists public.meta_ad_goals (
  master_plan_id uuid primary key references public.client_master_plans(id) on delete cascade,
  target_cpl numeric,
  daily_budget numeric,
  customer_value numeric,
  goal_leads integer,
  goal_by date,
  monthly_limit numeric,
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.meta_ad_reports (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  week_start date not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (master_plan_id, week_start)
);

alter table public.meta_ad_stats enable row level security;
alter table public.meta_ad_goals enable row level security;
alter table public.meta_ad_reports enable row level security;
