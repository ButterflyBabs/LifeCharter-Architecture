-- Guided weekly & monthly reviews: the assistant's briefing, the client's three
-- answers, and the three tasks they chose, kept as a history.
create table if not exists public.business_reviews (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  cadence text not null check (cadence in ('weekly','monthly')),
  period_start date not null,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  numbers jsonb not null default '{}'::jsonb,
  briefing jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  proposed jsonb not null default '[]'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  summary text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index if not exists business_reviews_one_per_period on public.business_reviews (master_plan_id, cadence, period_start);
alter table public.business_reviews enable row level security;
