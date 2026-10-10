-- Per-account finance preferences (the tax set-aside rate used on Tax Preparation and the Finance Center).
create table if not exists public.finance_settings (
  master_plan_id uuid primary key references public.client_master_plans(id) on delete cascade,
  tax_rate numeric not null default 25 check (tax_rate >= 0 and tax_rate <= 70),
  updated_at timestamptz not null default now()
);
alter table public.finance_settings enable row level security;
