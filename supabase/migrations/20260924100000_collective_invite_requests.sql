-- Invitation requests from the public Collective landing page
-- (lccommandsuite.com/collective). Each request gets an instant email with the
-- member's join link + invite code; we keep the lead (and where it came from)
-- even if they never finish joining, and stamp it when they do.
create table if not exists public.cm_invite_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  source text,
  utm jsonb,
  referrer text,
  sent_count integer not null default 0,
  last_sent_at timestamptz,
  joined_user_id uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists cm_invite_requests_email_idx on public.cm_invite_requests (lower(email));
alter table public.cm_invite_requests enable row level security;
create policy cm_invite_requests_admin_read on public.cm_invite_requests for select to authenticated using (cm_is_admin());
