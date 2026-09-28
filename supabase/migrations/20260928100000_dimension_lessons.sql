-- Lessons linked from weak scores: short "how to run this part" lessons per
-- business dimension, curated by the Alignment Architect (shared by every client).
create table if not exists public.dimension_lessons (
  id uuid primary key default gen_random_uuid(),
  dimension_key text not null,
  title text not null,
  summary text,
  body text,
  video_url text,
  resource_url text,
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dimension_lessons_dim on public.dimension_lessons (dimension_key, sort_order);
alter table public.dimension_lessons enable row level security;
