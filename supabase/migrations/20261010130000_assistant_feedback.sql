-- Thumbs up / down (with an optional note) on the AI assistant's answers, per account.
create table if not exists public.assistant_feedback (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  user_id uuid,
  rating text not null check (rating in ('up','down')),
  note text,
  question text,
  answer text,
  created_at timestamptz not null default now()
);
create index if not exists assistant_feedback_plan_idx on public.assistant_feedback (master_plan_id, created_at desc);
alter table public.assistant_feedback enable row level security;
