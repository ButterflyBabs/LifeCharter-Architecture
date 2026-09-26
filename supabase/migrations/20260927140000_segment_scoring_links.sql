-- Plan goals and sales activity can belong to a segment, so a segment's score
-- can come from what is really happening in it.
alter table public.client_plan_goals add column if not exists segment_id bigint references public.segments(id) on delete set null;
alter table public.sales_activities add column if not exists segment_id bigint references public.segments(id) on delete set null;
create index if not exists client_plan_goals_segment_idx on public.client_plan_goals (segment_id) where segment_id is not null;
create index if not exists sales_activities_segment_idx on public.sales_activities (segment_id) where segment_id is not null;

-- A dated score point per segment, so progress can be shown (weekly).
create table if not exists public.segment_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  segment_id bigint not null references public.segments(id) on delete cascade,
  overall int,
  domains jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists segment_score_snapshots_idx on public.segment_score_snapshots (segment_id, created_at desc);
alter table public.segment_score_snapshots enable row level security;
