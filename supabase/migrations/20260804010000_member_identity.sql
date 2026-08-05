-- Stage 3A.1: link team members to real login identities and hold their
-- per-area permissions. Additive; inert until member login is enabled.
alter table public.workspace_members
  add column if not exists user_id uuid,
  add column if not exists permissions jsonb not null default '{}'::jsonb;
