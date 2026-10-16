-- Embraced;Fully projects: groups for the E:F task list. Babs only, server-side access only, never shown elsewhere.
create table if not exists public.ef_projects (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  name text not null,
  goal text,
  status text not null default 'active' check (status in ('active','done')),
  due_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ef_projects_plan_idx on public.ef_projects (master_plan_id, status);
alter table public.ef_projects enable row level security;
alter table public.ef_tasks add column if not exists project_id uuid references public.ef_projects(id) on delete set null;
create index if not exists ef_tasks_project_idx on public.ef_tasks (project_id) where project_id is not null;
