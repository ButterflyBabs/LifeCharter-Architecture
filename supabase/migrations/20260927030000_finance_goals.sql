-- Explicit weekly / yearly income goals for the Financial Pulse card. The
-- monthly goal already lives in finance_budgets (type income, category '');
-- week and year default to figures derived from it unless set here.
create table if not exists public.finance_goals (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  period text not null check (period in ('week', 'year')),
  amount numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (master_plan_id, period)
);
alter table public.finance_goals enable row level security;
