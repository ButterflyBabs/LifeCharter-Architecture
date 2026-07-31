-- Google OAuth token storage for the Executive Home Inbox + Today's Schedule.
-- Single-tenant for now: one credential row keyed by account_key ('primary').
-- Tokens are sensitive: RLS is enabled with NO policy, so only the service role
-- (used by the server-side API routes) can read or write them.

create table if not exists public.google_credentials (
  account_key   text primary key default 'primary',
  email         text,
  access_token  text,
  refresh_token text,
  scope         text,
  expiry        timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.google_credentials enable row level security;
