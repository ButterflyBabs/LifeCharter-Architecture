-- "View as client": the Alignment Architect (Babs) can open a client's account read-only for support.
-- Every opening is logged here. The client can see their own rows in Settings; nobody else reads this table
-- except through the service role (RLS on, no policies).
create table if not exists client_view_log (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  client_name text,
  viewer_email text not null,
  viewer_user_id uuid,
  reason text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  user_agent text
);

create index if not exists client_view_log_plan_idx on client_view_log (master_plan_id, started_at desc);
create index if not exists client_view_log_started_idx on client_view_log (started_at desc);

alter table client_view_log enable row level security;
