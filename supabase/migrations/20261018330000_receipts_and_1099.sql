-- Task 1150 part 1 (applied 2026-10-18): receipt photos read by the client's assistant into expense drafts, and
-- year-end 1099 contractor totals (per payee: contractor?, W-9 on file?, paid only by card/PayPal?).
alter table public.finance_entries add column if not exists receipt_path text;
alter table public.finance_entries add column if not exists receipt_name text;
create table if not exists public.finance_receipts (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  path text not null,
  file_name text,
  status text not null default 'draft' check (status in ('draft','saved','discarded')),
  read jsonb not null default '{}'::jsonb,
  entry_id uuid references public.finance_entries(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists finance_receipts_plan_idx on public.finance_receipts (master_plan_id, created_at desc);
alter table public.finance_receipts enable row level security;
create table if not exists public.finance_payees (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  vendor_key text not null,
  name text not null,
  contractor boolean not null default false,
  w9_on_file boolean not null default false,
  paid_by_card boolean not null default false,
  note text,
  updated_at timestamptz not null default now(),
  unique (master_plan_id, vendor_key)
);
alter table public.finance_payees enable row level security;
