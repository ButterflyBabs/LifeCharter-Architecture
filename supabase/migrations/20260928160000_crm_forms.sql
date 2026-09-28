-- The Suite's own CRM (replaces Global Control / GoHighLevel). Contacts are the
-- existing seq_contacts (one table for everyone an account knows); this adds a
-- per-contact timeline, notes, and forms whose submissions land here. Everything
-- is scoped by master_plan_id so an account only ever sees its own people.
alter table public.seq_contacts add column if not exists notes text;
alter table public.seq_contacts add column if not exists last_activity_at timestamptz;

create table if not exists public.crm_events (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  contact_id uuid not null references public.seq_contacts(id) on delete cascade,
  kind text not null,                 -- form | note | purchase | sequence | tag | email | manual
  title text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists crm_events_contact on public.crm_events (contact_id, created_at desc);
create index if not exists crm_events_plan on public.crm_events (master_plan_id, created_at desc);

create table if not exists public.crm_forms (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  fields jsonb not null default '[]'::jsonb,      -- [{name,label,type,required,options?}]
  tags text[] not null default '{}',
  sequence_key text,                               -- enrol submitters into this sequence
  notify boolean not null default true,            -- email the owner on each submission
  success_message text not null default 'Thank you! We received it and will be in touch soon.',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (master_plan_id, key)
);

create table if not exists public.crm_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.crm_forms(id) on delete cascade,
  contact_id uuid references public.seq_contacts(id) on delete set null,
  data jsonb not null,
  page_url text,
  created_at timestamptz not null default now()
);
create index if not exists crm_submissions_form on public.crm_submissions (form_id, created_at desc);

alter table public.crm_events enable row level security;
alter table public.crm_forms enable row level security;
alter table public.crm_submissions enable row level security;
