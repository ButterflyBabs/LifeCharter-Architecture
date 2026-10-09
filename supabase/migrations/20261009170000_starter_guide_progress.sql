-- The Starter Guide's ticks, saved on the client's account (not just the browser) so they follow the client to every device.
create table if not exists starter_guide_progress (
  master_plan_id uuid primary key references client_master_plans(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table starter_guide_progress enable row level security;
