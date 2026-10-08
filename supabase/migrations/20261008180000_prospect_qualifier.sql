-- Prospect Qualifier: scores a pasted profile against one of the account's Ideal Client Profiles (fit, level, gap,
-- DM angle, priority) and connects the result to Outreach Pipelines. Audience Qualifier does a first pass on a
-- whole list at once and ranks it.

-- An account can keep several Ideal Client Profiles (usually one per offer). The four levels are the client's own
-- wording; exactly one of them is marked as their ideal client.
create table if not exists icp_profiles (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  name text not null,
  offer_id uuid references sales_offers(id) on delete set null,
  who_serve text not null default '',
  help_do text not null default '',
  signature_offer text not null default '',
  core_problem text not null default '',
  already_has text not null default '',
  missing text not null default '',
  red_flags text not null default '',
  levels jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists icp_profiles_plan on icp_profiles (master_plan_id, sort_order);
alter table icp_profiles enable row level security;

-- One list scored in one go (Audience Qualifier).
create table if not exists icp_audiences (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  icp_id uuid references icp_profiles(id) on delete set null,
  name text not null,
  total integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists icp_audiences_plan on icp_audiences (master_plan_id, created_at desc);
alter table icp_audiences enable row level security;

-- Every score: kind 'profile' is a full qualification from pasted profile text; kind 'audience' is one row of a
-- list's first pass.
create table if not exists icp_qualifications (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  icp_id uuid references icp_profiles(id) on delete set null,
  icp_name text,
  kind text not null default 'profile' check (kind in ('profile', 'audience')),
  audience_id uuid references icp_audiences(id) on delete cascade,
  card_id uuid references dm_cards(id) on delete set null,
  name text not null default '',
  platform text,
  profile_url text,
  link_code text,
  source_text text,
  fit text,
  level text,
  priority text,
  dm_angle text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists icp_qualifications_plan on icp_qualifications (master_plan_id, kind, created_at desc);
create index if not exists icp_qualifications_card on icp_qualifications (card_id, created_at desc) where card_id is not null;
create index if not exists icp_qualifications_audience on icp_qualifications (audience_id) where audience_id is not null;
alter table icp_qualifications enable row level security;

revoke all on icp_profiles, icp_audiences, icp_qualifications from anon, authenticated;

-- The latest result shows on the pipeline card as a badge.
alter table dm_cards add column if not exists qual_priority text;
alter table dm_cards add column if not exists qual_fit text;
alter table dm_cards add column if not exists qual_level text;
alter table dm_cards add column if not exists qual_id uuid;
