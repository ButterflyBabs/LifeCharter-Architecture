-- support_requests existed in the live database without a migration; its shape at 2026-09-28:
--   id uuid pk, user_id uuid, name, email, category, priority, subject, message, status text, created_at timestamptz
-- Support desk: requests get a status, an account, a conversation thread and timestamps.
alter table public.support_requests add column if not exists master_plan_id uuid references public.client_master_plans(id) on delete set null;
alter table public.support_requests add column if not exists source text not null default 'form';
alter table public.support_requests add column if not exists updated_at timestamptz not null default now();
alter table public.support_requests add column if not exists resolved_at timestamptz;
alter table public.support_requests alter column status set default 'open';
update public.support_requests set status = 'open' where status is null;
alter table public.support_requests enable row level security;
create table if not exists public.support_replies (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.support_requests(id) on delete cascade,
  author text not null check (author in ('client','support')),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists support_replies_request on public.support_replies (request_id, created_at);
alter table public.support_replies enable row level security;
