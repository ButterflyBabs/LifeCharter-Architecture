-- Get paid inside the Suite, step b (task 1146): invoices from a contact, the Payments page, and automatic posting.
-- Everything is created ON the client's own connected Stripe account (direct charges, no platform fee).
--
-- suite_invoices: an invoice (or an invoice payment plan of N monthly payments) sent from a contact.
-- suite_payments: every payment the Connect webhook sees on the client's account (payment links, invoices, plans,
--                 monthly subscriptions). One row per Stripe object (checkout session or invoice), never twice.
create table if not exists public.suite_invoices (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  contact_id uuid references public.seq_contacts(id) on delete set null,
  offer_id uuid references public.sales_offers(id) on delete set null,
  stripe_account text not null,
  livemode boolean not null default false,
  stripe_customer_id text,
  stripe_invoice_id text,                       -- a single invoice; for a plan, the first invoice
  stripe_schedule_id text,                      -- payment plans: the subscription schedule that stops after N payments
  stripe_subscription_id text,
  number text,
  email text not null,
  name text,
  description text not null,
  amount numeric(12,2) not null,                -- the total
  payment_count int not null default 1,         -- 1 = paid in full; N = N monthly payments of amount / N
  payments_made int not null default 0,
  days_until_due int not null default 7,
  status text not null default 'open' check (status in ('open','paid','void','uncollectible','plan_active','plan_done','plan_cancelled')),
  hosted_url text,
  pdf_url text,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists suite_invoices_plan_idx on public.suite_invoices (master_plan_id, created_at desc);
create index if not exists suite_invoices_contact_idx on public.suite_invoices (contact_id);
create unique index if not exists suite_invoices_stripe_invoice on public.suite_invoices (stripe_invoice_id) where stripe_invoice_id is not null;
create unique index if not exists suite_invoices_stripe_schedule on public.suite_invoices (stripe_schedule_id) where stripe_schedule_id is not null;
alter table public.suite_invoices enable row level security;

create table if not exists public.suite_payments (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  stripe_account text not null,
  livemode boolean not null default false,
  stripe_ref text not null,                     -- cs_... (payment link checkout) or in_... (invoice, plan or subscription payment)
  stripe_charge_id text,
  kind text not null check (kind in ('link','invoice','plan','subscription')),
  amount numeric(12,2) not null,
  currency text not null default 'usd',
  refunded numeric(12,2) not null default 0,
  email text,
  name text,
  contact_id uuid references public.seq_contacts(id) on delete set null,
  offer_id uuid references public.sales_offers(id) on delete set null,
  invoice_id uuid references public.suite_invoices(id) on delete set null,
  description text not null default '',
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index if not exists suite_payments_ref on public.suite_payments (stripe_account, stripe_ref);
create index if not exists suite_payments_plan_idx on public.suite_payments (master_plan_id, paid_at desc);
create index if not exists suite_payments_charge_idx on public.suite_payments (stripe_charge_id);
alter table public.suite_payments enable row level security;
