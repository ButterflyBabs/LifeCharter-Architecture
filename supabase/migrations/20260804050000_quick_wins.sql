-- Quick Wins: small, high-leverage actions a client can take today. Seeded with
-- 10 defaults on first load, then fully editable — manually or AI-generated.
-- Clicking a quick win still spins up a real task; these rows are the catalog.
create table if not exists public.quick_wins (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  title text not null,
  detail text default '',
  emoji text default '⚡',
  priority text default 'medium',   -- high | medium | low
  sort_order int default 0,
  source text default 'default',    -- default | manual | ai
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quick_wins_mpid_idx on public.quick_wins (master_plan_id);
alter table public.quick_wins enable row level security;
