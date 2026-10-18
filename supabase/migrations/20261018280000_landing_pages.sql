-- Task 1153: simple landing pages (opt-in, webinar/event, sales, book a call) on the client's own forms, events,
-- offers and booking pages; visits and conversions per page; the client's own Meta pixel.
create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  template text not null check (template in ('optin','webinar','sales','booking')),
  slug text not null unique,
  name text not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  content jsonb not null default '{}'::jsonb,
  look jsonb not null default '{}'::jsonb,
  form_id uuid references public.crm_forms(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  offer_id uuid references public.sales_offers(id) on delete set null,
  calendar_id uuid references public.booking_calendars(id) on delete set null,
  button_url text,
  pixel_id text,
  image_path text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists landing_pages_plan_idx on public.landing_pages (master_plan_id);
alter table public.landing_pages enable row level security;

create table if not exists public.landing_page_hits (
  id bigint generated always as identity primary key,
  page_id uuid not null references public.landing_pages(id) on delete cascade,
  kind text not null check (kind in ('view','conversion')),
  visitor text,
  created_at timestamptz not null default now()
);
create index if not exists landing_page_hits_idx on public.landing_page_hits (page_id, kind, created_at);
alter table public.landing_page_hits enable row level security;
