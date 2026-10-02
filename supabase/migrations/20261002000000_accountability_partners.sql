-- Accountability partners.
-- A partnership is its OWN record between two people (side "a" = the client who
-- invited, side "b" = their partner), not a team seat: nothing in a client's
-- account is visible to a partner except what that client adds to the
-- partnership. Side b is either another Suite client (b_plan_id) or someone
-- outside the system who uses a private no-login link (token).
-- All access goes through server routes (service role); RLS on, no policies.
create table if not exists accountability_partnerships (
  id uuid primary key default gen_random_uuid(),
  a_plan_id uuid not null references client_master_plans(id) on delete cascade,
  a_name text not null default 'Your partner',
  b_plan_id uuid references client_master_plans(id) on delete set null,
  b_name text not null,
  b_email text not null,
  token text not null unique,
  status text not null default 'invited' check (status in ('invited', 'active', 'paused', 'ended')),
  coach_visible boolean not null default false,       -- client opted in to let their coach see this
  a_notify boolean not null default true,
  b_notify boolean not null default true,
  invite_sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists acc_partnerships_a on accountability_partnerships (a_plan_id);
create index if not exists acc_partnerships_b on accountability_partnerships (b_plan_id);
alter table accountability_partnerships enable row level security;

-- Things a person is holding themselves to. Everything here is visible to both
-- partners. A linked task (task_id) mirrors the live task.
create table if not exists accountability_items (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references accountability_partnerships(id) on delete cascade,
  side text not null check (side in ('a', 'b')),
  kind text not null default 'task' check (kind in ('task', 'milestone', 'project', 'deadline', 'habit')),
  title text not null,
  detail text,
  due_on date,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  committed boolean not null default false,            -- a real promise, not just a to-do
  task_id bigint references tasks(id) on delete set null,
  reward text,                                         -- what they'll give themselves / their partner on completion
  if_missed text,                                      -- what it looks like if they don't
  follow_through text not null default 'pending' check (follow_through in ('pending', 'done', 'skipped')),
  completed_at timestamptz,
  reminded_at timestamptz,                             -- "due tomorrow" nudge sent
  missed_notified_at timestamptz,                      -- gentle "it slipped" nudge sent
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists acc_items_partnership on accountability_items (partnership_id, status, due_on);
alter table accountability_items enable row level security;

create table if not exists accountability_notes (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references accountability_partnerships(id) on delete cascade,
  item_id uuid references accountability_items(id) on delete cascade,
  side text not null check (side in ('a', 'b')),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists acc_notes_item on accountability_notes (item_id, created_at);
alter table accountability_notes enable row level security;

-- Encouragement, nudges, "I'm stuck" requests and automatic reminders.
create table if not exists accountability_nudges (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references accountability_partnerships(id) on delete cascade,
  from_side text not null check (from_side in ('a', 'b', 'system')),
  to_side text not null check (to_side in ('a', 'b')),
  item_id uuid references accountability_items(id) on delete set null,
  kind text not null default 'encourage' check (kind in ('encourage', 'nudge', 'inspire', 'support', 'celebrate', 'stuck', 'reminder', 'custom')),
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists acc_nudges_partnership on accountability_nudges (partnership_id, created_at desc);
alter table accountability_nudges enable row level security;

-- A person's own saved encouragement messages.
create table if not exists accountability_templates (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references accountability_partnerships(id) on delete cascade,
  side text not null check (side in ('a', 'b')),
  kind text not null default 'encourage' check (kind in ('encourage', 'nudge', 'inspire', 'support', 'celebrate')),
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists acc_templates_partnership on accountability_templates (partnership_id, side);
alter table accountability_templates enable row level security;

-- How each person wants to be held accountable. One per side; both can read both.
-- consequence_mode: the person chooses whether what-happens-if-I-miss is just a
-- pledge written here, tracked item by item as followed through or not, both, or none.
create table if not exists accountability_agreements (
  partnership_id uuid not null references accountability_partnerships(id) on delete cascade,
  side text not null check (side in ('a', 'b')),
  how_held text,
  tone text not null default 'gentle' check (tone in ('gentle', 'balanced', 'direct')),
  check_in text,
  reward_self text,
  reward_partner text,
  miss_plan text,
  stuck_plan text,
  consequence_mode text not null default 'pledge' check (consequence_mode in ('none', 'pledge', 'tracked', 'both')),
  updated_at timestamptz not null default now(),
  primary key (partnership_id, side)
);
alter table accountability_agreements enable row level security;

-- Weekly check-ins, one per side per week.
create table if not exists accountability_checkins (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references accountability_partnerships(id) on delete cascade,
  side text not null check (side in ('a', 'b')),
  week_of date not null,                               -- the Monday
  wins text,
  stuck text,
  next_commit text,
  created_at timestamptz not null default now(),
  unique (partnership_id, side, week_of)
);
alter table accountability_checkins enable row level security;

-- A cap on AI drafting for outside partners (it runs on the client's own key).
create table if not exists accountability_ai_uses (
  id bigint generated always as identity primary key,
  partnership_id uuid not null references accountability_partnerships(id) on delete cascade,
  side text not null,
  created_at timestamptz not null default now()
);
create index if not exists acc_ai_uses_partnership on accountability_ai_uses (partnership_id, side, created_at desc);
alter table accountability_ai_uses enable row level security;
