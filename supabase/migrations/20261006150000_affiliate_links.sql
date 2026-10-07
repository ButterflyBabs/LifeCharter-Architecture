-- One tracked link per product for each affiliate (e.g. "MasterClass + Command Suite"):
-- its own code (/r/<code>), where it lands, an optional commission % and its own results.
-- Clicks, referrals and sales remember which link brought them in.
create table if not exists affiliate_links (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  master_plan_id uuid not null,
  product text not null,
  code text not null unique,
  landing_url text,
  rate numeric,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now()
);
create index if not exists affiliate_links_aff on affiliate_links (affiliate_id);
alter table affiliate_links enable row level security;
alter table affiliate_clicks add column if not exists link_id uuid references affiliate_links(id) on delete set null;
alter table affiliate_referrals add column if not exists link_id uuid references affiliate_links(id) on delete set null;
alter table affiliate_sales add column if not exists link_id uuid references affiliate_links(id) on delete set null;
alter table seq_contacts add column if not exists referred_by_link_id uuid references affiliate_links(id) on delete set null;
