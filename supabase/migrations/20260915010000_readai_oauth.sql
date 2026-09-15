-- Read.ai OAuth token storage for the MasterClass recording automation.
-- Single-tenant: one credential row keyed by account_key ('primary'),
-- mirroring google_credentials (20260731010000_google_oauth.sql).
-- Tokens are sensitive: RLS is enabled with NO policy, so only the service
-- role (used by the server-side API routes) can read or write them.

create table if not exists public.read_ai_credentials (
  account_key   text primary key default 'primary',
  access_token  text,
  refresh_token text,
  expiry        timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.read_ai_credentials enable row level security;
