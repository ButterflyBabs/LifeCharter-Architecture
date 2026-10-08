-- Meta lead ads: each form submission is sent here (by a Make/Zapier scenario or Meta itself) with a secret in the
-- address. The secret identifies the workspace; leads are logged so a repeat delivery is never double-processed.
create table if not exists meta_lead_settings (
  master_plan_id uuid primary key references client_master_plans(id) on delete cascade,
  secret text not null,
  created_at timestamptz not null default now()
);
alter table meta_lead_settings enable row level security;
create table if not exists meta_leads (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  email text,
  name text,
  ad_name text,
  form_name text,
  answers jsonb,
  status text not null default 'received',
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists meta_leads_recent on meta_leads (master_plan_id, created_at desc);
alter table meta_leads enable row level security;
