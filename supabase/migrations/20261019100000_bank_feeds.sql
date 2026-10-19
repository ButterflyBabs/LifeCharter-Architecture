-- Bank and card feeds (task 1150 part 2): Stripe Financial Connections, read-only. A client links a bank or card once; the Suite
-- pulls its transactions every day into a review list, and only what the client approves posts to the Finance Center.
-- Everything here is written by the server (service role); the browser never reads these tables directly.

create table if not exists public.bank_feed_customers (
  master_plan_id uuid primary key,
  stripe_customer_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  fc_account_id text not null,                 -- Stripe Financial Connections account (fca_...)
  institution_name text,
  display_name text,
  last4 text,
  category text,                               -- checking, savings, credit_card, ...
  status text not null default 'active',       -- active | inactive (unlinked, or the bank asked to sign in again)
  livemode boolean not null default true,
  business_id integer,                         -- optional: every transaction from this account belongs to one business
  last_refresh_token text,                     -- the last Stripe transaction refresh we pulled
  last_synced_at timestamptz,
  last_error text,
  linked_by text,
  created_at timestamptz not null default now(),
  unique (fc_account_id)
);
create index if not exists bank_connections_plan on public.bank_connections (master_plan_id, status);

create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  connection_id uuid not null references public.bank_connections(id) on delete cascade,
  fc_txn_id text not null,                     -- fctxn_...
  amount_cents integer not null,               -- Stripe's sign: negative = money out, positive = money in
  currency text not null default 'usd',
  description text,
  transacted_on date not null,
  bank_status text not null default 'posted',  -- pending | posted | void
  review_status text not null default 'new',   -- new | approved | skipped | transfer | duplicate
  suggested_type text,                         -- income | expense
  suggested_category text,
  suggested_vendor text,
  matched_entry_id uuid,                       -- an existing ledger line that looks like the same money
  entry_id uuid,                               -- the ledger line created when approved
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fc_txn_id)
);
create index if not exists bank_transactions_review on public.bank_transactions (master_plan_id, review_status, transacted_on desc);

alter table public.bank_feed_customers enable row level security;
alter table public.bank_connections enable row level security;
alter table public.bank_transactions enable row level security;
