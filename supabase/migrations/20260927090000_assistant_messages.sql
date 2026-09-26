-- Each client's conversation with their AI assistant, so it remembers what was
-- asked. Service role only (RLS on, no policies).
create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  source text not null default 'mariposa',
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists assistant_messages_plan_idx on public.assistant_messages (master_plan_id, created_at desc);
alter table public.assistant_messages enable row level security;
