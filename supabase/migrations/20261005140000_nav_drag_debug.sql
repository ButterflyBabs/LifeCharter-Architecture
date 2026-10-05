create table if not exists public.nav_drag_debug (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.nav_drag_debug enable row level security;
