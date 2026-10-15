-- Team Huddle for every account: each account keeps its own settings (meeting length, usual day and time,
-- its own agenda template), and the extra-people list is per account (one email can be on several accounts).
create table if not exists public.team_huddle_settings (
  master_plan_id uuid primary key,
  title text not null default 'Weekly Team Huddle',
  max_minutes integer not null default 30,
  weekday integer,                                   -- 0 Sunday .. 6 Saturday, null = no usual day
  start_time text not null default '08:00',
  template jsonb,                                    -- the account's own agenda sections, null = the standard agenda
  updated_at timestamptz not null default now()
);
alter table public.team_huddle_settings enable row level security;
alter table public.team_huddle_access drop constraint if exists team_huddle_access_pkey;
alter table public.team_huddle_access add primary key (master_plan_id, email);
