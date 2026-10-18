-- Client portal look, per client (Babs 2026-10-18: "clients need to be able to customize what the client portal looks
-- like per client"): colors, font, heading, logo, banner, and which sections show, in what order, under what names.
-- client_portal_defaults holds the account's own default look; a new portal starts from it.
alter table public.client_portals add column if not exists look jsonb not null default '{}'::jsonb;
create table if not exists public.client_portal_defaults (
  master_plan_id uuid primary key references public.client_master_plans(id) on delete cascade,
  look jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.client_portal_defaults enable row level security;
