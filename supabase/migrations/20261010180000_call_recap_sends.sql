-- One recap email per person per session, so a re-run never sends twice.
create table if not exists public.call_recap_sends (
  meeting_uuid text not null,
  email text not null,
  kind text not null check (kind in ('attended','missed')),
  sent_at timestamptz not null default now(),
  primary key (meeting_uuid, email, kind)
);
alter table public.call_recap_sends enable row level security;
