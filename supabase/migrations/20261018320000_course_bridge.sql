-- Task 1152 part 2: the bridge from other course platforms (Payhip, Kajabi, Teachable, Thinkific, Zapier/Make).
-- Each connection has its own private receiving address; each product can tag, record income, start a campaign and
-- add the buyer to a Suite course. Every incoming sale is logged once (retries are ignored).
create table if not exists public.bridge_connections (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  platform text not null check (platform in ('payhip','kajabi','teachable','thinkific','zapier')),
  token text not null unique,
  signing_key text,
  active boolean not null default true,
  last_event_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists bridge_connections_plan_idx on public.bridge_connections (master_plan_id);
alter table public.bridge_connections enable row level security;

create table if not exists public.bridge_products (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  platform text not null,
  product_key text not null,
  product_name text,
  tags text[] not null default '{}',
  record_income boolean not null default true,
  sequence_key text,
  program_id uuid references public.programs(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (master_plan_id, platform, product_key)
);
alter table public.bridge_products enable row level security;

create table if not exists public.bridge_events (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  connection_id uuid references public.bridge_connections(id) on delete set null,
  platform text not null,
  kind text not null,
  external_id text not null,
  email text,
  product_key text,
  product_name text,
  amount numeric,
  contact_id uuid references public.seq_contacts(id) on delete set null,
  status text not null default 'done',
  note text,
  created_at timestamptz not null default now(),
  unique (master_plan_id, platform, kind, external_id)
);
create index if not exists bridge_events_plan_idx on public.bridge_events (master_plan_id, created_at desc);
alter table public.bridge_events enable row level security;
