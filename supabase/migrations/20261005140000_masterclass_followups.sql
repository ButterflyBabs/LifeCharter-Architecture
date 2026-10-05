-- After each MasterClass: who attended and who registered but did not (the ledger that tags
-- contacts and starts the replay + follow-up campaigns once), and the replay link released for
-- each session. Written by /api/cron/masterclass-attendance and /api/masterclass/replay.
-- Server-only: RLS on, no policies. See src/lib/masterclass/followUp.ts.
create table if not exists public.masterclass_followups (
  session_date date not null,
  email text not null,
  outcome text not null check (outcome in ('attended','no_show')),
  contact_id uuid references public.seq_contacts(id) on delete set null,
  tagged_at timestamptz not null default now(),
  enrolled_at timestamptz,
  primary key (session_date, email)
);
create table if not exists public.masterclass_replays (
  session_date date primary key,
  replay_url text not null,
  released_at timestamptz not null default now()
);
alter table public.masterclass_followups enable row level security;
alter table public.masterclass_replays enable row level security;
revoke all on public.masterclass_followups from anon, authenticated;
revoke all on public.masterclass_replays from anon, authenticated;
