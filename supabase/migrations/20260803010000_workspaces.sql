-- Live workspaces + team members (Settings → Workspace).
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid,
  name text not null default 'My Workspace',
  slug text,
  description text,
  website text,
  logo_url text,
  socials jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists workspaces_slug_unique
  on public.workspaces (lower(slug)) where slug is not null and slug <> '';

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text,
  email text,
  role text not null default 'editor',
  status text not null default 'active',
  avatar_url text,
  joined_at date default current_date,
  created_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- Public "assets" bucket for workspace logos / member avatars.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assets','assets', true, 5242880,
  array['image/png','image/jpeg','image/jpg','image/webp','image/svg+xml'])
on conflict (id) do update set public = true;
