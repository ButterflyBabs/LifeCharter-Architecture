-- Client portal, second release (task 1147): group programs and cohorts. Decisions (Babs 2026-10-18): members see
-- programs inside their own portal (joining creates one); a group feed with first names only; each lesson opens now or
-- on a date; members are added by hand, plus automatically when they buy the program's offer.
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  name text not null,
  description text,
  offer_id uuid references public.sales_offers(id) on delete set null,   -- buying this offer adds the buyer
  starts_on date,
  ends_on date,
  feed_on boolean not null default true,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists programs_plan_idx on public.programs (master_plan_id);
alter table public.programs enable row level security;

create table if not exists public.program_members (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  contact_id uuid not null references public.seq_contacts(id) on delete cascade,
  status text not null default 'active' check (status in ('active','removed')),
  source text,
  joined_at timestamptz not null default now(),
  unique (program_id, contact_id)
);
create index if not exists program_members_contact_idx on public.program_members (contact_id);
alter table public.program_members enable row level security;

create table if not exists public.program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  duration_min int not null default 60 check (duration_min between 5 and 600),
  join_url text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists program_sessions_idx on public.program_sessions (program_id, starts_at);
alter table public.program_sessions enable row level security;

create table if not exists public.program_lessons (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  title text not null,
  body text,
  url text,
  video_url text,
  file_path text,
  file_name text,
  opens_on date,                         -- null = open now
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists program_lessons_idx on public.program_lessons (program_id, position);
alter table public.program_lessons enable row level security;

create table if not exists public.program_tasks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  title text not null,
  body text,
  due_on date,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.program_tasks enable row level security;

create table if not exists public.program_task_done (
  task_id uuid not null references public.program_tasks(id) on delete cascade,
  contact_id uuid not null references public.seq_contacts(id) on delete cascade,
  done_at timestamptz not null default now(),
  primary key (task_id, contact_id)
);
alter table public.program_task_done enable row level security;

create table if not exists public.program_posts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  parent_id uuid references public.program_posts(id) on delete cascade,
  author text not null check (author in ('owner','member')),
  contact_id uuid references public.seq_contacts(id) on delete cascade,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists program_posts_idx on public.program_posts (program_id, created_at);
alter table public.program_posts enable row level security;

-- An LC Volant report shared with a whole program (group recaps).
alter table public.volant_reports add column if not exists program_id uuid references public.programs(id) on delete set null;
alter table public.volant_reports add column if not exists program_shared_at timestamptz;
