-- Task 1155: out-of-office mode and the year-in-review page.
create table if not exists public.away_mode (
  master_plan_id uuid primary key references public.client_master_plans(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  message text,
  block_bookings boolean not null default true,
  auto_reply boolean not null default true,
  pause_nudges boolean not null default true,
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
alter table public.away_mode enable row level security;

create table if not exists public.year_review_links (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  year int not null,
  token text not null unique,
  show_money boolean not null default false,
  created_at timestamptz not null default now(),
  unique (master_plan_id, year)
);
alter table public.year_review_links enable row level security;
