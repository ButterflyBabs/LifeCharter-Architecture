-- Microsoft 365 (Graph) OAuth token storage — the Microsoft twin of
-- google_credentials, so Gmail and M365 can be connected side by side.
-- Single account row keyed by account_key ('primary'). Tokens are sensitive:
-- RLS on with NO policy → only the service role (server API routes) can touch it.

create table if not exists public.microsoft_credentials (
  account_key   text primary key default 'primary',
  email         text,
  access_token  text,
  refresh_token text,
  scope         text,
  expiry        timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.microsoft_credentials enable row level security;
