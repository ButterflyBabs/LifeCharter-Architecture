-- Event engine for every account (task 1149; Babs's decisions 2026-10-18): any client can run a live event (webinar,
-- MasterClass, workshop) or a multi-day challenge. Public sign-up page in their branding, confirmation with a calendar
-- invite, reminders 24 hours and 1 hour before, a join link they paste themselves, attendance, a replay email with an
-- optional expiry and a reminder before it closes, and a follow-up campaign. Challenges send each day by email and unlock
-- it on a private challenge page where people tick days off. Free now; paid tickets come with payments.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  kind text not null default 'live' check (kind in ('live','challenge')),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  host_name text,
  accent text,
  starts_at timestamptz,                 -- live events
  duration_min int not null default 60,
  timezone text not null default 'America/Denver',
  join_url text,
  days int,                              -- challenges: how many days
  starts_on date,                        -- challenges: day 1 (null = each person starts the day after they sign up)
  send_hour int not null default 7 check (send_hour between 0 and 23),
  capacity int,
  tags text[] not null default '{}',
  follow_up_key text,                    -- a campaign to start when the replay goes out (or the challenge ends)
  replay_url text,
  replay_hours int,                      -- null = no expiry
  replay_sent_at timestamptz,
  status text not null default 'draft' check (status in ('draft','published','ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_plan_idx on public.events (master_plan_id);
alter table public.events enable row level security;

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  contact_id uuid references public.seq_contacts(id) on delete set null,
  email text not null,
  first_name text,
  timezone text,
  token text not null unique,            -- their private challenge / replay link
  answers jsonb not null default '{}'::jsonb,
  attended boolean,
  reminded_24h_at timestamptz,
  reminded_1h_at timestamptz,
  challenge_start date,
  last_day_sent int not null default 0,
  replay_sent_at timestamptz,
  replay_reminded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);
create index if not exists event_registrations_event_idx on public.event_registrations (event_id);
alter table public.event_registrations enable row level security;

create table if not exists public.event_days (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  day int not null check (day between 1 and 60),
  title text not null,
  body text,
  video_url text,
  url text,
  action text,                           -- today's small step
  unique (event_id, day)
);
alter table public.event_days enable row level security;

create table if not exists public.event_day_done (
  registration_id uuid not null references public.event_registrations(id) on delete cascade,
  day int not null,
  done_at timestamptz not null default now(),
  primary key (registration_id, day)
);
alter table public.event_day_done enable row level security;
