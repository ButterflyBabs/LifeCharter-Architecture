-- Which assistant drafted a plan section (each client's own assistant, by name).
alter table public.plan_sections add column if not exists ai_by text;

-- What each client's assistant concluded about a planning area (forecast, hub
-- briefing, finance, sales…). Every row belongs to one client's plan.
create table if not exists public.planning_insights (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  area text not null,
  assistant text,
  content jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists planning_insights_plan_area_idx on public.planning_insights (master_plan_id, area, created_at desc);
alter table public.planning_insights enable row level security;
