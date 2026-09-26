-- Client testimonials & reviews: one client's own, never shared across accounts.
create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  token text not null unique,
  client_name text not null default '',
  client_email text,
  program text not null default '',
  from_name text not null default '',
  message text not null default '',
  status text not null default 'sent' check (status in ('sent','opened','completed')),
  opened_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists review_requests_plan_idx on public.review_requests (master_plan_id, created_at desc);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  request_id uuid references public.review_requests(id) on delete set null,
  client_name text not null default '',
  client_email text,
  program text not null default '',
  rating int check (rating between 1 and 5),
  type text not null default 'text' check (type in ('text','video','audio')),
  headline text not null default '',
  content text not null default '',
  media_url text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','featured','hidden')),
  consent boolean not null default false,
  source text not null default 'collected' check (source in ('collected','manual')),
  shares int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists testimonials_plan_idx on public.testimonials (master_plan_id, created_at desc);

alter table public.review_requests enable row level security;
alter table public.testimonials enable row level security;
