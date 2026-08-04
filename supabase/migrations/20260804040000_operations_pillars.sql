-- The 8 operational pillars, per client. Only status + notes are stored here;
-- the catalog (keys, names, descriptions) lives in src/lib/operations.ts.
create table if not exists public.operations_pillars (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid,
  pillar_key text not null,
  status text not null default 'not_started',  -- not_started | in_progress | needs_attention | complete
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists operations_pillars_uniq
  on public.operations_pillars (master_plan_id, pillar_key);
alter table public.operations_pillars enable row level security;
