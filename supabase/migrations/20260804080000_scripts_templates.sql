-- Scripts & Templates: reusable scripts/templates stored by category. Seeded
-- with a starter set on first load, then fully editable; clients can add their
-- own manually or generate new ones with AI (driven by a few questions).
create table if not exists public.scripts_templates (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  title text not null,
  description text default '',
  item_type text default 'script',    -- script | template
  category text default 'Sales',
  channel text default 'sales',        -- sales | email | dm | objection | social
  content text not null,
  tags text default '',
  is_favorite boolean default false,
  usage_count int default 0,
  last_used timestamptz,
  source text default 'manual',        -- default | manual | ai
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists scripts_templates_mpid_idx on public.scripts_templates (master_plan_id);
alter table public.scripts_templates enable row level security;
