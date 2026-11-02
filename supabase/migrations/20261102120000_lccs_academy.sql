-- LCCS Academy: training for team members and clients. The lessons and questions live in the code
-- (src/content/academy); only what people do with them lives here. Reached through the service role, so no policies.
create table if not exists public.academy_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  master_plan_id uuid references public.client_master_plans(id) on delete cascade,
  email text,
  name text,
  best_score integer not null default 0,
  attempts integer not null default 0,
  passed_at timestamptz,
  last_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index if not exists academy_progress_plan_idx on public.academy_progress (master_plan_id);

-- One row per try, so the People view can show which questions trip people up.
create table if not exists public.academy_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  master_plan_id uuid references public.client_master_plans(id) on delete cascade,
  lesson_id text not null,
  score integer not null,
  passed boolean not null,
  missed text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists academy_attempts_plan_idx on public.academy_attempts (master_plan_id, created_at desc);

-- Babs's Edit / Approved on each lesson. content_hash shows when a lesson changed after she approved it.
create table if not exists public.academy_lesson_reviews (
  lesson_id text primary key,
  status text not null default 'draft' check (status in ('draft', 'approved', 'changes')),
  note text,
  content_hash text,
  updated_at timestamptz not null default now()
);

alter table public.academy_progress enable row level security;
alter table public.academy_attempts enable row level security;
alter table public.academy_lesson_reviews enable row level security;
