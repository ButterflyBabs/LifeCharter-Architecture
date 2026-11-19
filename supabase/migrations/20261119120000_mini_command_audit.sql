-- Mini Command Audit: the free lead-magnet audit (48 questions, 12 phases; a quick set of 24 first, the other 24 optional).
-- One row per person who finishes the quick set. Written only by the public API with the service key; never read by a browser directly.
create table if not exists public.mini_audit_runs (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  master_plan_id uuid references public.client_master_plans(id) on delete set null,
  contact_id uuid,
  first_name text not null,
  email text not null,
  profile jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  depth text not null default 'quick' check (depth in ('quick', 'full')),
  result jsonb not null default '{}'::jsonb,
  attribution jsonb not null default '{}'::jsonb,
  question_bank_version text not null default '1.0.0',
  email_status text,
  email_error text,
  emailed_at timestamptz,
  quick_completed_at timestamptz not null default now(),
  full_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mini_audit_runs_email_idx on public.mini_audit_runs (lower(email));
create index if not exists mini_audit_runs_created_idx on public.mini_audit_runs (created_at desc);
alter table public.mini_audit_runs enable row level security;
comment on table public.mini_audit_runs is 'Mini Command Audit lead magnet: answers, scored result and delivery status per person. Service key only.';
