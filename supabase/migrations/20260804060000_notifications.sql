-- Notifications feed behind the top-nav bell. Rows are a mix of:
--   derived — synthesized each GET from live state (uncategorized expenses,
--             pillars needing attention, tasks due) and upserted by a stable
--             nkey so read/dismissed state survives across refreshes;
--   one-off — explicit notifications other features can insert (nkey null).
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  nkey text,                          -- stable key for derived notifications; null for one-offs
  type text default 'info',           -- info | success | warning | action
  title text not null,
  body text default '',
  href text default '',
  read boolean default false,
  dismissed boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists notifications_key_uniq
  on public.notifications (master_plan_id, nkey) where nkey is not null;
create index if not exists notifications_mpid_idx on public.notifications (master_plan_id);
alter table public.notifications enable row level security;
