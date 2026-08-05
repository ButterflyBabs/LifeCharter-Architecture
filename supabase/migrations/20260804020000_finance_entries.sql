-- Financial ledger: persisted income + expense entries, per client. The Pulse
-- dashboard aggregates these into MTD / YTD income, expense, and net (resetting
-- on the 1st). Budgets and imports build on top of this in later phases.
create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid,
  type text not null default 'expense',      -- 'income' | 'expense'
  amount numeric not null default 0,
  category text,
  description text,
  segment_id uuid,
  occurred_on date not null default current_date,
  source text not null default 'manual',      -- 'manual' | 'import' | 'stripe' ...
  created_at timestamptz not null default now()
);
create index if not exists finance_entries_plan_date
  on public.finance_entries (master_plan_id, occurred_on desc);
alter table public.finance_entries enable row level security;
