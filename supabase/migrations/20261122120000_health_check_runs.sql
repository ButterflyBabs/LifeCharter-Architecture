-- Business Health Check: the free lead-magnet scorecard (25 questions, 6 categories).
-- One row per person who finishes it. Written only by the public API with the service key; read only by Babs's
-- Alignment Architect > Audit Results page (through the API). Never read by a browser directly.
create table if not exists public.health_check_runs (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid references public.client_master_plans(id) on delete set null,
  contact_id uuid,
  first_name text not null,
  email text not null,
  phone text,
  business_name text,
  answers jsonb not null default '[]'::jsonb,
  result jsonb not null default '{}'::jsonb,
  overall integer not null,
  grade text not null,
  attribution jsonb not null default '{}'::jsonb,
  email_status text,
  created_at timestamptz not null default now()
);
create index if not exists health_check_runs_email_idx on public.health_check_runs (lower(email));
create index if not exists health_check_runs_created_idx on public.health_check_runs (created_at desc);
alter table public.health_check_runs enable row level security;
comment on table public.health_check_runs is 'Business Health Check lead magnet: answers, scored result and contact details per person. Service key only.';
