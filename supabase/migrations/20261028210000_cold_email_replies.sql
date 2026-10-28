-- Replies (and stop requests) that prospects send to a cold email, kept with their card so they can be read and answered from the pipeline.
create table if not exists public.cold_email_replies (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  card_id uuid not null references public.dm_cards(id) on delete cascade,
  message_id text not null,
  conversation_id text,
  from_email text,
  subject text,
  preview text,
  kind text not null default 'reply',
  received_at timestamptz not null default now(),
  answered_at timestamptz,
  answer_text text,
  created_at timestamptz not null default now(),
  unique (master_plan_id, message_id)
);
create index if not exists cold_email_replies_card on public.cold_email_replies (card_id, received_at desc);
alter table public.cold_email_replies enable row level security;
