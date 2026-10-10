-- Help answers suggested from resolved support tickets. Nothing reaches clients until Babs approves it.
create table if not exists public.help_suggestions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique,
  question text not null,
  answer text not null,
  category text,
  status text not null default 'pending' check (status in ('pending','approved','dismissed')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
alter table public.help_suggestions enable row level security;
