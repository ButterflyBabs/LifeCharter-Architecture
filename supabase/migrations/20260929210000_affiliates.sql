-- Affiliates (every account, each sees its own):
--   affiliates: people promoting this account's offers (tracked link /r/<code>, private portal /a/<token>)
--   affiliate_offer_rates: commission % for one affiliate on one offer (overrides the offer's own %)
--   sales_offers.affiliate_rate: the offer's default commission %
--   affiliate_clicks / affiliate_referrals / affiliate_sales: what each link brought in, and what's owed or paid
--   affiliate_programs / affiliate_program_earnings: programs this account promotes for others
create table if not exists affiliates (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  contact_id uuid references seq_contacts(id) on delete set null,
  name text not null,
  email text,
  code text not null unique,
  status text not null default 'active' check (status in ('active', 'paused')),
  default_rate numeric,                 -- % when neither the relationship nor the offer sets one
  landing_url text,                     -- where their link sends people
  agreement_on date,
  notes text,
  portal_token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists affiliates_plan on affiliates (master_plan_id);
alter table affiliates enable row level security;

alter table sales_offers add column if not exists affiliate_rate numeric;

create table if not exists affiliate_offer_rates (
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  offer_id uuid not null references sales_offers(id) on delete cascade,
  master_plan_id uuid not null,
  rate numeric not null,
  primary key (affiliate_id, offer_id)
);
alter table affiliate_offer_rates enable row level security;

create table if not exists affiliate_clicks (
  id bigint generated always as identity primary key,
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  master_plan_id uuid not null,
  referrer text,
  created_at timestamptz not null default now()
);
create index if not exists affiliate_clicks_aff on affiliate_clicks (affiliate_id, created_at desc);
alter table affiliate_clicks enable row level security;

create table if not exists affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  master_plan_id uuid not null,
  contact_id uuid references seq_contacts(id) on delete set null,
  kind text not null default 'lead' check (kind in ('lead', 'booking', 'purchase', 'manual')),
  source text,
  created_at timestamptz not null default now()
);
create index if not exists affiliate_referrals_aff on affiliate_referrals (affiliate_id, created_at desc);
alter table affiliate_referrals enable row level security;

alter table seq_contacts add column if not exists referred_by_affiliate_id uuid references affiliates(id) on delete set null;

create table if not exists affiliate_sales (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  master_plan_id uuid not null,
  contact_id uuid references seq_contacts(id) on delete set null,
  offer_id uuid references sales_offers(id) on delete set null,
  description text not null,
  amount numeric not null default 0,
  rate numeric,
  commission numeric not null default 0,
  sale_date date not null default current_date,
  status text not null default 'owed' check (status in ('review', 'owed', 'paid', 'void')),
  paid_at timestamptz,
  payout_note text,
  source text not null default 'manual',
  stripe_ref text unique,
  created_at timestamptz not null default now()
);
create index if not exists affiliate_sales_aff on affiliate_sales (affiliate_id, sale_date desc);
alter table affiliate_sales enable row level security;

create table if not exists affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  name text not null,
  website text,
  my_link text,
  my_code text,
  commission_terms text,
  login_url text,
  status text not null default 'active' check (status in ('applied', 'active', 'paused', 'ended')),
  notes text,
  created_at timestamptz not null default now()
);
alter table affiliate_programs enable row level security;

create table if not exists affiliate_program_earnings (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references affiliate_programs(id) on delete cascade,
  master_plan_id uuid not null,
  amount numeric not null,
  earned_on date not null default current_date,
  status text not null default 'expected' check (status in ('expected', 'paid')),
  note text,
  created_at timestamptz not null default now()
);
alter table affiliate_program_earnings enable row level security;

-- Recruiting uses an Outreach Pipeline board marked as the affiliate board.
alter table pipeline_boards add column if not exists purpose text not null default 'outreach' check (purpose in ('outreach', 'affiliate'));

-- Babs's Amazon Associates program (her tag).
insert into affiliate_programs (master_plan_id, name, website, my_link, my_code, commission_terms, login_url, status, notes)
select 'acc142bf-68d5-4d44-97dc-f25b00a3cef1', 'Amazon Associates', 'https://www.amazon.com', 'https://www.amazon.com/?tag=ruifinser04-20', 'ruifinser04-20',
  'Varies by product category', 'https://affiliate-program.amazon.com', 'active', 'Add ?tag=ruifinser04-20 to every Amazon link.'
where not exists (select 1 from affiliate_programs where master_plan_id = 'acc142bf-68d5-4d44-97dc-f25b00a3cef1' and name = 'Amazon Associates');
