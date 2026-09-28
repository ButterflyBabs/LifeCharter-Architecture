-- Sequences: timed email series run from the Suite (Phase 1: the Alignment
-- Architect's own, e.g. The Life Shift). master_plan_id scopes everything to the
-- account that owns it, ready for clients' own sequences in Phase 3.
create table if not exists public.seq_contacts (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  timezone text not null default 'America/Denver',
  source text,
  tags text[] not null default '{}',
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (master_plan_id, email)
);

create table if not exists public.sequences (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  from_name text not null default 'AmiLynne Carroll',
  from_email text not null,
  reply_to text not null default 'support@amilynnecarroll.com',
  brand text not null default 'LifeCharter',
  send_hour int not null default 7 check (send_hour between 0 and 23),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (master_plan_id, key)
);

create table if not exists public.sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.sequences(id) on delete cascade,
  position int not null,
  day_offset int not null default 0,        -- 0 = right away on enrolment; N = day N at send_hour in the contact's zone
  subject text not null,
  preview text,
  body text not null,                        -- plain text; blank-line paragraphs, "- " bullets, "1. " steps, links
  button_label text,
  button_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sequence_steps_seq on public.sequence_steps (sequence_id, position);

create table if not exists public.sequence_enrollments (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.sequences(id) on delete cascade,
  contact_id uuid not null references public.seq_contacts(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','completed','stopped')),
  enrolled_at timestamptz not null default now(),
  start_date date not null,                  -- day 0 in the contact's own zone
  source text,
  source_ref text,                           -- e.g. the Stripe checkout session, so a retry never enrols twice
  completed_at timestamptz,
  unique (sequence_id, contact_id)
);
create index if not exists sequence_enrollments_active on public.sequence_enrollments (status, sequence_id);

create table if not exists public.sequence_sends (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.sequence_enrollments(id) on delete cascade,
  step_id uuid not null references public.sequence_steps(id) on delete cascade,
  status text not null default 'claimed' check (status in ('claimed','sent','failed','skipped')),
  resend_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (enrollment_id, step_id)
);

alter table public.seq_contacts enable row level security;
alter table public.sequences enable row level security;
alter table public.sequence_steps enable row level security;
alter table public.sequence_enrollments enable row level security;
alter table public.sequence_sends enable row level security;
