-- The order each account wants its offer sections in (Campaigns & Broadcasts). One row per account.
create table if not exists public.crm_offer_order (
  master_plan_id uuid primary key,
  offers text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.crm_offer_order enable row level security;
revoke all on public.crm_offer_order from anon, authenticated;
