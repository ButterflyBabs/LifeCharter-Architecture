-- Embraced;Fully project milestones (checkpoints with a date). Babs only, server-side access only.
create table if not exists public.ef_milestones (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  project_id uuid not null references public.ef_projects(id) on delete cascade,
  title text not null,
  due_date date,
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ef_milestones_project_idx on public.ef_milestones (project_id);
alter table public.ef_milestones enable row level security;
