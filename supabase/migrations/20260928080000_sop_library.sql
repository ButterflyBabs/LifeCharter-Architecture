-- Playbook & SOP library: each client's standard operating procedures.
create table if not exists public.sops (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  title text not null,
  pillar_key text,
  purpose text,
  steps jsonb not null default '[]'::jsonb,
  owner text,
  tools text,
  status text not null default 'draft' check (status in ('draft','active')),
  last_reviewed date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sops_plan on public.sops (master_plan_id);
alter table public.sops enable row level security;
