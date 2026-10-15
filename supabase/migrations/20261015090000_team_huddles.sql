-- Team Huddle (Alignment Architect): the weekly LifeCharter team call. One row per call: the timed agenda,
-- the to-dos, notes, the recording link, the transcript and the AI summary. Everything lives in jsonb so the
-- whole page is editable. Babs edits; people on team_huddle_access can open it (and edit when can_edit).
create table if not exists public.team_huddles (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  call_date date not null,
  start_time text not null default '08:00',          -- Mountain time, free text "HH:MM"
  title text not null default 'Weekly LifeCharter Team Huddle',
  status text not null default 'upcoming',            -- 'upcoming' | 'done'
  agenda jsonb not null default '[]'::jsonb,          -- [{id,title,minutes,items:[{id,text,owner}]}]
  actions jsonb not null default '[]'::jsonb,         -- [{id,text,owner,due,done}]
  notes text not null default '',
  recording_url text not null default '',
  transcript text not null default '',
  summary jsonb,                                      -- {summary,wins,decisions,hot_topics,action_items,follow_ups,made_at}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists team_huddles_date_idx on public.team_huddles (master_plan_id, call_date desc);
alter table public.team_huddles enable row level security;

create table if not exists public.team_huddle_access (
  email text primary key,                             -- lower case
  master_plan_id uuid not null,
  name text,
  can_edit boolean not null default false,
  added_at timestamptz not null default now()
);
alter table public.team_huddle_access enable row level security;
