-- Stage 3A.2: invite-link login (no SMTP).
-- The owner mints a login for a team member and delivers the link themselves;
-- the member opens it, sets a password, and is signed in. We store only a
-- hash of the single-use token (never the token itself) plus an expiry.
alter table public.workspace_members
  add column if not exists invite_token_hash text,
  add column if not exists invite_expires_at timestamptz;

create index if not exists workspace_members_invite_token_hash_idx
  on public.workspace_members (invite_token_hash);

-- Case-insensitive email lookups (middleware gate + actor resolution match by email).
create index if not exists workspace_members_email_lower_idx
  on public.workspace_members (lower(email));
