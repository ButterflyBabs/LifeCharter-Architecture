-- Bills & cash calendar: what's due to go out (subscriptions, rent, tax dates,
-- loan payments…). "Mark paid" records the expense in finance_entries and moves
-- the bill to its next due date.
create table if not exists public.finance_bills (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  name text not null,
  amount numeric,
  category text,
  cadence text not null default 'monthly' check (cadence in ('weekly','monthly','quarterly','annual','once')),
  next_due date not null,
  autopay boolean not null default false,
  notes text,
  active boolean not null default true,
  last_paid_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists finance_bills_plan_due on public.finance_bills (master_plan_id, next_due) where active;
alter table public.finance_bills enable row level security;
