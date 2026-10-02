-- Calls between accountability partners: a standing recurring time or a quick one-off call.
-- A call stores a local date + clock time + the proposer's IANA timezone so recurring calls
-- hold their clock time through daylight saving; each person sees it in their own zone.
create table if not exists accountability_calls (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references accountability_partnerships(id) on delete cascade,
  kind text not null check (kind in ('recurring','one_off')),
  title text not null default 'Accountability call',
  starts_on date not null,
  local_time text not null,
  tz text not null default 'America/Denver',
  duration_min integer not null default 20,
  recur_freq text check (recur_freq in ('weekly','biweekly')),
  recur_days integer[],
  location text,
  note text,
  proposed_by text not null check (proposed_by in ('a','b')),
  status text not null default 'proposed' check (status in ('proposed','confirmed','declined','canceled')),
  skips text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists accountability_calls_partnership_idx on accountability_calls(partnership_id);
alter table accountability_calls enable row level security;
