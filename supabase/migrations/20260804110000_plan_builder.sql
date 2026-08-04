-- Plan-builder layer: structured, editable sections per plan (business, marketing,
-- sales, forecasting), AI cadence reviews, and generated proposals/grants.
create table if not exists public.plan_sections (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  plan_type text not null,        -- business | marketing | sales | forecasting
  section_key text not null,
  content text default '',
  answers jsonb default '{}',      -- answers to the section's guiding questions
  status text default 'empty',     -- empty | drafted | edited | done
  source text default 'client',    -- client | ai
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index if not exists plan_sections_uniq on public.plan_sections (master_plan_id, plan_type, section_key);
create index if not exists plan_sections_mpid_idx on public.plan_sections (master_plan_id, plan_type);
alter table public.plan_sections enable row level security;

create table if not exists public.plan_reviews (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  plan_type text not null,
  cadence text not null,           -- monthly | quarterly | semiannual | annual
  report jsonb not null,           -- { summary, strengths[], attention[{area,suggestion}], ... }
  created_at timestamptz not null default now()
);
create index if not exists plan_reviews_idx on public.plan_reviews (master_plan_id, plan_type);
alter table public.plan_reviews enable row level security;

create table if not exists public.plan_proposals (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  proposal_type text not null,     -- grant | investor | partnership | loan | sponsorship
  target text default '',
  title text default '',
  content text not null,           -- markdown
  created_at timestamptz not null default now()
);
create index if not exists plan_proposals_idx on public.plan_proposals (master_plan_id);
alter table public.plan_proposals enable row level security;
