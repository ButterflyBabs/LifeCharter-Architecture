-- Cold email sent from connected Google mailboxes inside the Suite (never Resend). One row of settings per account's Cold Email
-- pipeline, one row per sending mailbox, one row per email sent, and a ledger of inbox messages already read for replies.
create table if not exists public.cold_email_settings (
  master_plan_id uuid primary key references public.client_master_plans(id) on delete cascade,
  board_id uuid references public.pipeline_boards(id) on delete set null,
  enabled boolean not null default false,
  steps jsonb not null default '[]'::jsonb,
  tz text not null default 'America/Denver',
  window_start int not null default 9,
  window_end int not null default 16,
  weekdays_only boolean not null default true,
  footer text,
  started_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.cold_email_senders (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  account_key text not null,
  email text,
  daily_cap int not null default 30,
  paused boolean not null default false,
  fail_count int not null default 0,
  last_error text,
  scanned_at timestamptz,
  created_at timestamptz not null default now(),
  unique (master_plan_id, account_key)
);
create table if not exists public.cold_email_sends (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  card_id uuid not null references public.dm_cards(id) on delete cascade,
  step int not null,
  sender_id uuid references public.cold_email_senders(id) on delete set null,
  to_email text not null,
  subject text,
  message_id text,
  thread_id text,
  status text not null default 'sending',
  error text,
  sent_at timestamptz not null default now(),
  unique (card_id, step)
);
create index if not exists cold_email_sends_day on public.cold_email_sends (sender_id, sent_at);
create table if not exists public.cold_email_seen (
  sender_id uuid not null references public.cold_email_senders(id) on delete cascade,
  message_id text not null,
  kind text,
  card_id uuid,
  seen_at timestamptz not null default now(),
  primary key (sender_id, message_id)
);
alter table public.cold_email_settings enable row level security;
alter table public.cold_email_senders enable row level security;
alter table public.cold_email_sends enable row level security;
alter table public.cold_email_seen enable row level security;
