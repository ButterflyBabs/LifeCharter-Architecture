-- The Vimeo copy of each MasterClass / Incubator recording, found automatically (the hourly
-- collective-replays cron). It only fills the link on MasterClass Results; nothing is emailed until
-- Babs releases the replay (masterclass_replays). Server-only: RLS on, no policies.
create table if not exists public.masterclass_replay_links (
  session_date date not null,
  event_key text not null default 'masterclass',
  url text not null,
  found_at timestamptz not null default now(),
  primary key (session_date, event_key)
);
alter table public.masterclass_replay_links enable row level security;
revoke all on public.masterclass_replay_links from anon, authenticated;
