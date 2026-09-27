-- Website Alignment Reviews (Babs, 2026-09-27): every client gets one within 14 days. Claude writes it,
-- it is published into the client's Command Suite account, and they get an email. Server-only.
create table if not exists public.website_reviews (
  master_plan_id uuid primary key references public.client_master_plans (id) on delete cascade,
  website text,
  content text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.website_reviews enable row level security;
revoke all on public.website_reviews from anon, authenticated;
