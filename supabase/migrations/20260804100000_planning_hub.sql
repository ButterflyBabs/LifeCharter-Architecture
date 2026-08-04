-- Strategic Planning Hub: scheduled planning reviews (upcoming + history) and
-- the client's forecasting assumptions. Plans themselves live in client_plans;
-- finance in finance_entries; sales pipeline in sales_activities.
create table if not exists public.planning_reviews (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  title text not null,
  section_key text default 'general',   -- business | marketing | sales | forecasting | finance | general
  scheduled_for date,
  status text default 'upcoming',        -- upcoming | completed
  notes text default '',
  completed_at timestamptz,
  calendar_event_id text,                -- id of the created calendar event, if any
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists planning_reviews_mpid_idx on public.planning_reviews (master_plan_id);
alter table public.planning_reviews enable row level security;

create table if not exists public.forecast_assumptions (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null unique,
  horizon_months int default 6,
  monthly_growth_pct numeric default 3,
  pipeline_close_pct numeric default 20,
  expense_ratio_pct numeric default 0,   -- 0 = derive from actuals
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.forecast_assumptions enable row level security;
