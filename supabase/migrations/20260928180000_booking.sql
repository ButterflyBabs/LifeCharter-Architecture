-- Booking links (the Suite's own scheduler, replacing Global Control calendars).
-- Everything belongs to one account (master_plan_id). Hosts are the people who
-- take meetings; each connects any number of Google / Microsoft calendars, all
-- checked for busy time. A booking calendar (e.g. Executive Consultation) has
-- one host or rotates among several (round robin) and can copy others (cc).
create table if not exists public.booking_hosts (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  name text not null,
  email text not null,
  zoom_email text,                                  -- Zoom user to host meetings (defaults to email)
  timezone text not null default 'America/Denver',
  weekly jsonb not null default '{"mon":[["09:00","17:00"]],"tue":[["09:00","17:00"]],"wed":[["09:00","17:00"]],"thu":[["09:00","17:00"]],"fri":[["09:00","17:00"]]}'::jsonb,
  connect_key text not null default encode(gen_random_bytes(24), 'hex'),  -- private link for connecting their calendars
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (master_plan_id, email)
);

create table if not exists public.booking_connections (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.booking_hosts(id) on delete cascade,
  provider text not null check (provider in ('google','microsoft')),
  email text,
  access_token text,
  refresh_token text,
  expiry timestamptz,
  scope text,
  check_busy boolean not null default true,         -- count this calendar's events as busy
  add_events boolean not null default false,        -- new bookings are added to this calendar
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (host_id, provider, email)
);

create table if not exists public.booking_calendars (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  slug text not null unique,                        -- lccommandsuite.com/book/<slug>
  name text not null,
  description text,
  duration_min int not null default 30 check (duration_min between 5 and 480),
  slot_step_min int not null default 30 check (slot_step_min between 5 and 240),
  buffer_before_min int not null default 0,
  buffer_after_min int not null default 15,
  min_notice_hours int not null default 12,
  max_days_ahead int not null default 30,
  daily_cap int,                                    -- per host per day; null = no cap
  assignment text not null default 'single' check (assignment in ('single','round_robin')),
  host_ids uuid[] not null default '{}',
  cc_emails text[] not null default '{}',
  location text not null default 'zoom' check (location in ('zoom','phone','custom')),
  location_detail text,
  questions jsonb not null default '[]'::jsonb,     -- extra FormField[] asked when booking
  tags text[] not null default '{}',
  sequence_key text,
  confirmation_note text,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  calendar_id uuid not null references public.booking_calendars(id) on delete cascade,
  host_id uuid references public.booking_hosts(id) on delete set null,
  contact_id uuid references public.seq_contacts(id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  invitee_name text not null,
  invitee_email text not null,
  invitee_phone text,
  invitee_timezone text,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'confirmed' check (status in ('confirmed','canceled','rescheduled','completed','no_show')),
  meeting_url text,
  zoom_meeting_id text,
  host_event jsonb,                                 -- {connection_id, provider, event_id}
  manage_token_hash text not null,
  rescheduled_from uuid references public.bookings(id) on delete set null,
  reminders jsonb not null default '{}'::jsonb,     -- {"r24": ts, "r1": ts}
  cancel_reason text,
  canceled_at timestamptz,
  created_at timestamptz not null default now()
);
-- One confirmed booking per host per start time, even under a race.
create unique index if not exists bookings_host_slot on public.bookings (host_id, start_at) where status = 'confirmed';
create index if not exists bookings_upcoming on public.bookings (status, start_at);
create index if not exists bookings_plan on public.bookings (master_plan_id, start_at desc);

alter table public.booking_hosts enable row level security;
alter table public.booking_connections enable row level security;
alter table public.booking_calendars enable row level security;
alter table public.bookings enable row level security;
