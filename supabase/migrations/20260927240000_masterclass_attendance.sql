-- Who actually attended each MasterClass session, from Zoom's past-meeting participant list.
-- One row per person per session (their joins summed). Written by /api/cron/masterclass-attendance;
-- read by the owner-only /masterclass-results page. Server-only: RLS on, no policies.
create table if not exists public.masterclass_attendance (
  session_date date not null,
  email text not null,
  name text,
  minutes integer not null default 0,
  first_joined_at timestamptz,
  zoom_meeting_uuid text,
  updated_at timestamptz not null default now(),
  primary key (session_date, email)
);

alter table public.masterclass_attendance enable row level security;
revoke all on public.masterclass_attendance from anon, authenticated;
