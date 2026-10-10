-- Who attended which coaching call / event (from Zoom's participant reports), so each person is credited once per session.
create table if not exists public.call_attendance_syncs (
  meeting_uuid text not null,
  email text not null,
  meeting_id text,
  topic text,
  started_at timestamptz,
  minutes integer,
  created_at timestamptz not null default now(),
  primary key (meeting_uuid, email)
);
alter table public.call_attendance_syncs enable row level security;
