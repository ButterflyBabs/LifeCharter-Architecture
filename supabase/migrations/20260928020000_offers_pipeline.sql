-- Real Offers & Packages and a Pipeline (deals board) for every client account (Babs, 2026-09-28).
-- Each row belongs to one account (master_plan_id). The app reads and writes through the service
-- role and always filters by the signed-in account, so RLS is on with no policies (no direct access).

create table if not exists public.sales_offers (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  business_id bigint references public.businesses(id) on delete set null,
  name text not null,
  format text not null default 'one_to_one' check (format in ('one_to_one','group','course','done_for_you','retainer','product','hybrid','other')),
  price numeric(12,2),
  billing text not null default 'one_time' check (billing in ('one_time','monthly','payment_plan')),
  payment_count int check (payment_count is null or payment_count between 1 and 60),
  deliverables text[] not null default '{}',
  transformation text,
  ideal_client text,
  not_for text,
  guarantee text,
  duration text,
  capacity int check (capacity is null or capacity >= 0),
  link text,
  status text not null default 'active' check (status in ('active','draft','retired')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sales_offers_plan_idx on public.sales_offers (master_plan_id, sort_order);

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  name text not null,
  kind text not null default 'open' check (kind in ('open','won','lost')),
  probability int not null default 0 check (probability between 0 and 100),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists pipeline_stages_plan_idx on public.pipeline_stages (master_plan_id, sort_order);

create table if not exists public.pipeline_deals (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  stage_id uuid not null references public.pipeline_stages(id) on delete restrict,
  offer_id uuid references public.sales_offers(id) on delete set null,
  business_id bigint references public.businesses(id) on delete set null,
  contact_name text not null,
  company text,
  email text,
  value numeric(12,2),
  probability int check (probability is null or probability between 0 and 100), -- null = the stage's default
  expected_close date,
  next_step text,
  next_step_due date,
  source text,
  notes text,
  sort_order int not null default 0,
  stage_changed_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pipeline_deals_plan_idx on public.pipeline_deals (master_plan_id, stage_id);
create index if not exists pipeline_deals_due_idx on public.pipeline_deals (master_plan_id, next_step_due);

-- Calls and follow-ups logged in Daily Compass can belong to a deal.
alter table public.sales_activities add column if not exists deal_id uuid references public.pipeline_deals(id) on delete set null;
create index if not exists sales_activities_deal_idx on public.sales_activities (deal_id) where deal_id is not null;

alter table public.sales_offers enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.pipeline_deals enable row level security;
revoke all on public.sales_offers, public.pipeline_stages, public.pipeline_deals from anon, authenticated;
