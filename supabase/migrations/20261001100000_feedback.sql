-- Suggestion / Feedback / Glitch — the light-bulb button in the top nav.
-- Glitch reports are private to the submitting account (its own team only);
-- Suggestion and Feedback are global — every signed-in Suite user (any
-- account) sees and can vote on them. The first genuinely cross-tenant,
-- user-generated table in this app; everything else here is per-account.
create table if not exists feedback_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('glitch', 'suggestion', 'feedback')),
  master_plan_id uuid references client_master_plans(id) on delete set null, -- the submitter's account (Glitch scoping + shown to admins)
  user_id uuid references profiles(id) on delete set null,                  -- the submitter
  submitter_name text not null default 'A client',                          -- first name only, snapshotted at submit time
  title text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'under_review', 'planned', 'shipped', 'closed')),
  vote_count integer not null default 0,
  support_request_id uuid references support_requests(id) on delete set null, -- set when a Glitch also opened a ticket
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists feedback_items_kind on feedback_items (kind, vote_count desc, created_at desc);
create index if not exists feedback_items_plan on feedback_items (master_plan_id, created_at desc);
alter table feedback_items enable row level security;

create table if not exists feedback_votes (
  item_id uuid not null references feedback_items(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);
alter table feedback_votes enable row level security;
