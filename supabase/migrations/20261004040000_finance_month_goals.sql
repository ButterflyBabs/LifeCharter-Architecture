-- Month-by-month income goals (a ramp). A month with no row falls back to the account's general monthly goal
-- (finance_budgets: income, category '').
create table if not exists public.finance_month_goals (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  month text not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  amount numeric not null check (amount > 0),
  updated_at timestamptz not null default now(),
  unique (master_plan_id, month)
);
create index if not exists finance_month_goals_plan_idx on public.finance_month_goals (master_plan_id, month);
alter table public.finance_month_goals enable row level security;
