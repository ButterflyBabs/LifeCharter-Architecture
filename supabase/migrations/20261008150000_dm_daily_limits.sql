-- Every DM logged with "I sent it" on an outreach card, so the pipeline can show how many went out on each
-- platform in the last 24 hours against a daily limit the client sets (default 25).
create table if not exists dm_sends (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  card_id uuid,
  board_id uuid,
  platform text,
  script_title text,
  sent_at timestamptz not null default now()
);
create index if not exists dm_sends_recent on dm_sends (master_plan_id, platform, sent_at desc);
alter table dm_sends enable row level security;

create table if not exists dm_platform_limits (
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  platform text not null,
  daily_limit integer not null check (daily_limit between 0 and 1000),
  primary key (master_plan_id, platform)
);
alter table dm_platform_limits enable row level security;
