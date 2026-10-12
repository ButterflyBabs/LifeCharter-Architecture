-- LinkedIn connection requests found in a connected Microsoft 365 inbox and turned into outreach cards. One row per
-- email, so the same request is never added twice.
create table if not exists dm_inbound_log (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  source text not null default 'linkedin',
  external_id text not null,
  card_id uuid,
  person_name text,
  created_at timestamptz not null default now(),
  unique (master_plan_id, source, external_id)
);
alter table dm_inbound_log enable row level security;
