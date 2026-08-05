-- Budgets, as minimal or detailed as each client wants:
--   minimal  -> one 'expense' row with category '' (overall monthly budget),
--               optionally one 'income' row with category '' (monthly target)
--   detailed -> many rows, one per category
-- amount is a monthly figure; YTD budget = amount * months elapsed.
create table if not exists public.finance_budgets (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid,
  type text not null default 'expense',   -- 'income' | 'expense'
  category text not null default '',       -- '' = overall/total
  amount numeric not null default 0,       -- monthly amount
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists finance_budgets_uniq
  on public.finance_budgets (master_plan_id, type, lower(category));
alter table public.finance_budgets enable row level security;
