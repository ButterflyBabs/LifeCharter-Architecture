-- Self-serve Starter sign-ups: the account is created only after the client signs the Year-1 Operating Agreement.
-- One row per paid checkout session: pending (agreement sent, waiting for the signature) -> provisioned (account created).
create table if not exists public.starter_signups (
  stripe_session_id text primary key,
  email text not null,
  full_name text,
  plan_id text not null default 'starter',
  is_test boolean not null default false,
  agreement_document_id text,
  status text not null default 'pending',
  signed_at timestamptz,
  provisioned_at timestamptz,
  emailed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index if not exists starter_signups_status_idx on public.starter_signups (status, created_at);
alter table public.starter_signups enable row level security;
