-- Broadcasts: one-off emails from the Suite CRM to everyone carrying a tag (or
-- tags), excluding unsubscribes. Scoped by master_plan_id like the rest of the
-- CRM. Service-role only (RLS on, no policies).
create table if not exists public.crm_broadcasts (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  template_key text,                               -- e.g. masterclass-replay (code-defined templates)
  name text not null,
  subject text not null default '',
  preview text,
  body text not null default '',                   -- same plain-text format as sequence steps
  button_label text,
  button_url text,
  brand text not null default 'LifeCharter',
  from_name text not null default 'AmiLynne Carroll',
  from_email text not null default 'hello@lifecharter.life',
  reply_to text not null default 'support@amilynnecarroll.com',
  tags text[] not null default '{}',
  tag_match text not null default 'any' check (tag_match in ('any','all')),
  skip_prior_template boolean not null default false, -- skip anyone already sent an earlier broadcast from this template
  variables jsonb not null default '{}'::jsonb,    -- {{slot}} fills, e.g. {"replay_url":"https://vimeo.com/..."}
  status text not null default 'draft' check (status in ('draft','scheduled','sending','sent','canceled')),
  scheduled_at timestamptz,
  timezone text not null default 'America/Denver',
  queued_at timestamptz,                           -- recipients snapshotted into crm_broadcast_sends
  started_at timestamptz,
  finished_at timestamptz,
  recipient_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_broadcasts_plan on public.crm_broadcasts (master_plan_id, created_at desc);
create index if not exists crm_broadcasts_due on public.crm_broadcasts (status, scheduled_at);

-- One row per recipient. queued → claimed (just before the send; never re-sent)
-- → sent | failed; skipped if they unsubscribed after queueing.
create table if not exists public.crm_broadcast_sends (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references public.crm_broadcasts(id) on delete cascade,
  contact_id uuid not null references public.seq_contacts(id) on delete cascade,
  email text not null,
  status text not null default 'queued' check (status in ('queued','claimed','sent','failed','skipped')),
  resend_id text,
  error text,
  claimed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (broadcast_id, contact_id)
);
create index if not exists crm_broadcast_sends_status on public.crm_broadcast_sends (broadcast_id, status);
create index if not exists crm_broadcast_sends_contact on public.crm_broadcast_sends (contact_id);

alter table public.crm_broadcasts enable row level security;
alter table public.crm_broadcast_sends enable row level security;
