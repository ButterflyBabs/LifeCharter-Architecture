-- Get paid inside the Suite, step a (task 1146). A client connects THEIR OWN Stripe account with "Connect with Stripe"
-- (Standard account, OAuth); the connection lives in client_integrations (provider 'stripe_connect', metadata.account_id).
-- Payment links are created ON the client's connected account (direct charges, no platform fee): the money goes
-- straight to the client and never passes through the Suite's own Stripe account. One live link per offer.
create table if not exists public.offer_payment_links (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  offer_id uuid not null references public.sales_offers(id) on delete cascade,
  stripe_account text not null,                 -- acct_... the client's own connected account
  livemode boolean not null default false,
  kind text not null check (kind in ('one_time','monthly','payment_plan')),
  amount numeric(12,2) not null,                -- what each payment charges, in USD
  payment_count int,                            -- payment plans only (step b)
  product_id text,
  price_id text,
  payment_link_id text not null,
  url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists offer_payment_links_one_live on public.offer_payment_links (offer_id) where active;
create index if not exists offer_payment_links_plan_idx on public.offer_payment_links (master_plan_id, created_at desc);
alter table public.offer_payment_links enable row level security;
