-- Client portal (task 1147, Babs's decisions 2026-10-18): each account's own clients get a private portal link (no
-- password) showing their package and sessions left, upcoming bookings, invoices to pay, shared LC Volant recaps,
-- homework, goals, files and messages, in the account's own branding. Group programs come in a second release.
create table if not exists public.client_portals (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  contact_id uuid not null unique references public.seq_contacts(id) on delete cascade,
  token text not null unique,            -- the private link's key (like project share links)
  active boolean not null default true,
  welcome text,                          -- an optional note shown at the top of the portal
  sent_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists client_portals_plan_idx on public.client_portals (master_plan_id);
alter table public.client_portals enable row level security;

-- A package of sessions bought by a client (from an offer or typed in). Sessions used = the rows in package_sessions:
-- one is added when a booking is marked Attended, and the owner can add or remove sessions by hand.
create table if not exists public.client_packages (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  contact_id uuid not null references public.seq_contacts(id) on delete cascade,
  offer_id uuid references public.sales_offers(id) on delete set null,
  name text not null,
  sessions_total int not null check (sessions_total between 1 and 500),
  calendar_ids uuid[] not null default '{}',   -- bookings on these calendars count; empty = any of the account's calendars
  starts_on date not null default current_date,
  expires_on date,
  status text not null default 'active' check (status in ('active','done','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists client_packages_contact_idx on public.client_packages (contact_id);
alter table public.client_packages enable row level security;

create table if not exists public.package_sessions (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.client_packages(id) on delete cascade,
  booking_id uuid unique references public.bookings(id) on delete set null,
  delta int not null default 1 check (delta in (-1, 1)),
  used_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists package_sessions_package_idx on public.package_sessions (package_id);
alter table public.package_sessions enable row level security;

-- Homework (the client ticks it off), goals and resources (a link or a file), shown in the portal.
create table if not exists public.portal_items (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  contact_id uuid not null references public.seq_contacts(id) on delete cascade,
  kind text not null check (kind in ('homework','goal','resource')),
  title text not null,
  body text,
  url text,
  file_path text,                        -- in the private bucket portal-files
  file_name text,
  due_on date,
  status text not null default 'open' check (status in ('open','done','achieved','paused')),
  done_at timestamptz,
  done_by text check (done_by in ('client','owner')),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists portal_items_contact_idx on public.portal_items (contact_id, kind, position);
alter table public.portal_items enable row level security;

create table if not exists public.portal_messages (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  contact_id uuid not null references public.seq_contacts(id) on delete cascade,
  author text not null check (author in ('owner','client')),
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists portal_messages_contact_idx on public.portal_messages (contact_id, created_at);
alter table public.portal_messages enable row level security;

-- An LC Volant report the owner chose to show in the client's portal (private sections never show).
alter table public.volant_reports add column if not exists shared_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit) values ('portal-files', 'portal-files', false, 52428800)
on conflict (id) do nothing;
