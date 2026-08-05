-- Per-client third-party integration credentials (e.g. Global Control).
-- Keys are exclusive to each client, so this is scoped by master_plan_id and
-- only ever read/written through the service role (never exposed to the client).
create table if not exists public.client_integrations (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid,
  provider text not null,          -- e.g. 'global_control'
  api_key text,                    -- the client's secret; never returned to the browser
  external_id text,                -- optional account / location / sub-account id
  status text not null default 'connected',
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists client_integrations_plan_provider
  on public.client_integrations (master_plan_id, provider);
alter table public.client_integrations enable row level security;
