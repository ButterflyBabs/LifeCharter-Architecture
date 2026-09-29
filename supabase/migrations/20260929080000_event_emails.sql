-- Suite-owned confirmation + reminder emails for the Zoom events (Command Shift
-- MasterClass, LifeCharter Incubator), replacing Global Control's workflows.
-- Service-role only (RLS on, no policies). See src/lib/eventEmails.ts.

create table if not exists public.event_email_templates (
  id uuid primary key default gen_random_uuid(),
  event_key text not null check (event_key in ('masterclass','incubator')),
  kind text not null check (kind in ('confirm','day_before','hour_before')),
  subject text not null default '',
  preview text,
  body text not null default '',          -- same plain-text format as sequence steps; {{first_name}} {{greeting}} {{event_date_time}}
  button_label text,                      -- button URL is always the registrant's own Zoom join link
  active boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (event_key, kind)
);
alter table public.event_email_templates enable row level security;

-- Send ledger. Inserting the row is the claim; the unique key (nulls not
-- distinct, so the one 'confirm' per registrant with occurrence_start null is
-- unique too) means nothing is ever sent twice.
create table if not exists public.event_email_sends (
  id uuid primary key default gen_random_uuid(),
  zoom_registrant_id text not null,
  event_key text not null,
  kind text not null check (kind in ('confirm','day_before','hour_before')),
  occurrence_start timestamptz,           -- null for 'confirm'
  contact_id uuid references public.seq_contacts(id) on delete set null,
  email text not null,
  status text not null default 'claimed' check (status in ('claimed','sent','failed','skipped')),
  resend_id text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint event_email_sends_once unique nulls not distinct (zoom_registrant_id, kind, occurrence_start)
);
create index if not exists event_email_sends_event_kind_idx on public.event_email_sends (event_key, kind, status);
alter table public.event_email_sends enable row level security;

alter table public.zoom_registrant_syncs
  add column if not exists join_url text,
  add column if not exists event_key text,
  add column if not exists registered_at timestamptz,
  add column if not exists suite_emails boolean not null default false;
create index if not exists zoom_registrant_syncs_suite_idx on public.zoom_registrant_syncs (event_key) where suite_emails;

-- Existing rows: label the event from the meeting id (all stay on Global Control).
update public.zoom_registrant_syncs set event_key = case zoom_meeting_id
    when '89905406248' then 'masterclass'
    when '86873557607' then 'incubator'
  end
where event_key is null;

-- The cut-over switches (off). Turn one on with, e.g.:
--   update public.app_settings set value = '{"suite_emails_on":true,"switched_on_at":"' || (to_json(now())#>>'{}') || '"}' where key = 'event_emails:masterclass';
insert into public.app_settings (key, value) values
  ('event_emails:masterclass', '{"suite_emails_on":false,"switched_on_at":null}'),
  ('event_emails:incubator',   '{"suite_emails_on":false,"switched_on_at":null}')
on conflict (key) do nothing;
