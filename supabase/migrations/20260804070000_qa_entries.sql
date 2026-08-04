-- Client-authored Q&A entries that extend the built-in knowledge base
-- (src/lib/knowledgeBase.ts) without a deploy. The Help page and the Travel
-- Partner "Ask" widget merge these with the static catalog.
create table if not exists public.qa_entries (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  category text default 'General',
  question text not null,
  answer text not null,
  keywords text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists qa_entries_mpid_idx on public.qa_entries (master_plan_id);
alter table public.qa_entries enable row level security;
