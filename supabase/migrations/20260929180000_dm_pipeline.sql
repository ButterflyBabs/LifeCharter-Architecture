-- DM Pipeline: prospects you're messaging on Instagram, Facebook or LinkedIn, moved
-- stage to stage. Each stage can set a follow-up (days after the move), which becomes
-- a task. Separate from the Sales Pipeline; "Booked" creates a Sales Pipeline deal.
create table if not exists dm_stages (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  key text,                       -- the built-in meaning (to_reach, sent, followed_up, conversation, invited, booked, nurture, not_now)
  name text not null,
  follow_up_days int,             -- null = no follow-up
  kind text not null default 'open' check (kind in ('open', 'booked', 'closed')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists dm_stages_plan on dm_stages (master_plan_id, sort_order);
alter table dm_stages enable row level security;

create table if not exists dm_cards (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  stage_id uuid not null references dm_stages(id) on delete restrict,
  contact_id uuid references seq_contacts(id) on delete set null,
  name text not null,
  handle text,                    -- @handle or profile name on the platform
  profile_url text,
  email text,
  platform text not null default 'IG' check (platform in ('IG', 'FB', 'LI')),
  script_id uuid,
  script_title text,
  notes text,
  last_contacted_at timestamptz,
  follow_up_on date,
  follow_up_task_id bigint,
  deal_id uuid,
  sort_order int not null default 0,
  stage_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dm_cards_plan on dm_cards (master_plan_id, stage_id, sort_order);
alter table dm_cards enable row level security;
