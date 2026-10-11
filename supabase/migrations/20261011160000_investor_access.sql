-- Investor page access: one row per person who asked for the investor documents. The request itself arrives through the
-- Suite CRM form "Investor access request" (contact + tag investor-inquiry + email to Babs); this table holds the
-- decision and that person's own access code (stored only as a scrypt hash). Service role only.
create table if not exists investor_access (
  email text primary key,
  name text not null default '',
  company text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','denied','revoked')),
  code_hash text,
  code_salt text,
  code_v text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  emailed_at timestamptz,
  last_login_at timestamptz
);
alter table investor_access enable row level security;
revoke all on investor_access from anon, authenticated;
