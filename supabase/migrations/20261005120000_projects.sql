create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  name text not null,
  goal text,
  status text not null default 'active' check (status in ('planning','active','on_hold','done')),
  owner_member_id uuid,
  start_date date,
  due_date date,
  color text,
  notes text,
  template_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_plan_idx on public.projects (master_plan_id, status);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  master_plan_id uuid not null,
  title text not null,
  due_date date,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists project_milestones_project_idx on public.project_milestones (project_id);

create table if not exists public.project_guests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  master_plan_id uuid not null,
  name text not null,
  email text,
  role text not null check (role in ('client','contractor')),
  token text not null unique,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists project_guests_project_idx on public.project_guests (project_id);

alter table public.tasks
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists start_date date,
  add column if not exists shared boolean not null default false,
  add column if not exists assignee_guest_id uuid references public.project_guests(id) on delete set null;
create index if not exists tasks_project_idx on public.tasks (project_id);

alter table public.projects enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_guests enable row level security;
