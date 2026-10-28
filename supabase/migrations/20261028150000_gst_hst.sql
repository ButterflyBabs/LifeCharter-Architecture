-- Canadian GST/HST (task 1520 follow-up). A registered account charges GST/HST by the customer's province and the
-- Suite keeps the tax apart from income so the GST/HST report can total it. Existing rows get 0 tax (nothing changes).
create table if not exists public.sales_tax_settings (
  master_plan_id uuid primary key references public.client_master_plans(id) on delete cascade,
  registered boolean not null default false,
  business_number text,
  province text,
  filing_frequency text not null default 'quarterly' check (filing_frequency in ('monthly','quarterly','annual')),
  registered_from date,
  stripe_rates jsonb not null default '{}'::jsonb, -- { "<acct>": { "ON": "txr_..." } } Stripe tax rates made on the client's own account
  updated_at timestamptz not null default now()
);
alter table public.sales_tax_settings enable row level security;

alter table public.finance_entries add column if not exists tax_amount numeric not null default 0; -- GST/HST collected (income) or paid (expense), not in amount
alter table public.finance_entries add column if not exists tax_province text;
alter table public.suite_payments add column if not exists tax_amount numeric not null default 0;
alter table public.suite_payments add column if not exists tax_province text;
alter table public.suite_invoices add column if not exists tax_amount numeric not null default 0;
alter table public.suite_invoices add column if not exists tax_province text;
alter table public.bookings add column if not exists tax_province text;

-- A GST/HST account's offer link is a Suite pay page (/pay/<id>), not a Stripe payment link.
alter table public.offer_payment_links alter column payment_link_id drop not null;
