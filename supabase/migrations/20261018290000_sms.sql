-- Task 1151: text messages. Each account gets its own verified toll-free number in the Suite's Twilio account
-- (Babs absorbs the cost; hard cap 500 texts per account per month). Reminders first, two-way next.
create table if not exists public.sms_accounts (
  master_plan_id uuid primary key references public.client_master_plans(id) on delete cascade,
  phone_number text,
  phone_sid text,
  verification_sid text,
  status text not null default 'none' check (status in ('none','pending','in_review','approved','rejected','suspended')),
  status_note text,
  business jsonb not null default '{}'::jsonb,
  reminders_on boolean not null default true,
  reminder_24h boolean not null default true,
  reminder_1h boolean not null default true,
  template_24h text,
  template_1h text,
  submitted_at timestamptz,
  approved_at timestamptz,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sms_accounts enable row level security;
create unique index if not exists sms_accounts_phone_idx on public.sms_accounts (phone_number) where phone_number is not null;

create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  contact_id uuid references public.seq_contacts(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  direction text not null check (direction in ('out','in')),
  kind text not null default 'manual' check (kind in ('reminder','manual','auto','system','inbound')),
  to_number text not null,
  from_number text not null,
  body text not null,
  segments int not null default 1,
  status text not null default 'queued',
  twilio_sid text unique,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists sms_messages_plan_idx on public.sms_messages (master_plan_id, created_at desc);
create index if not exists sms_messages_contact_idx on public.sms_messages (contact_id, created_at desc);
alter table public.sms_messages enable row level security;

alter table public.seq_contacts add column if not exists sms_consent_at timestamptz;
alter table public.seq_contacts add column if not exists sms_opted_out_at timestamptz;
alter table public.bookings add column if not exists sms_ok boolean not null default false;
