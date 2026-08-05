-- Multi-business model (ported from LC-Executive-Dashboard's Drizzle schema)
-- Introduces the Sacred Kaleidoscope -> Business -> Segment hierarchy plus
-- per-segment revenue, per-segment dimension health, a segment/dimension-aware
-- tasks table, and per-user dashboard layouts.
--
-- Part of the exec-into-architecture merge (phase 1). Additive only:
-- no existing Architecture tables are modified. RLS is enabled on every new
-- table with an authenticated-access policy, matching the rest of the schema.

-- ---------------------------------------------------------------------------
-- Enums (guarded so re-runs / partial applies don't error)
-- ---------------------------------------------------------------------------
do $$ begin
  create type priority as enum ('optional', 'low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('backlog', 'today', 'in_progress', 'waiting', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type health as enum ('healthy', 'attention', 'at_risk');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Sacred Kaleidoscope (parent entity)
-- ---------------------------------------------------------------------------
create table if not exists public.sacred_kaleidoscope (
  id          bigint generated always as identity primary key,
  name        varchar(100) not null default 'Sacred Kaleidoscope Community LLC',
  description text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Businesses (under Sacred Kaleidoscope)
-- ---------------------------------------------------------------------------
create table if not exists public.businesses (
  id          bigint generated always as identity primary key,
  llc_id      bigint references public.sacred_kaleidoscope(id) default 1,
  name        varchar(100) not null,
  slug        varchar(50) not null unique,
  description text,
  icon        varchar(50),
  color       varchar(20),
  health      health default 'healthy',
  sort_order  integer default 0,
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Segments (under each Business)
-- ---------------------------------------------------------------------------
create table if not exists public.segments (
  id             bigint generated always as identity primary key,
  business_id    bigint not null references public.businesses(id) on delete cascade,
  name           varchar(100) not null,
  slug           varchar(50) not null,
  description    text,
  icon           varchar(50),
  color          varchar(20),
  health         health default 'healthy',
  sort_order     integer default 0,
  revenue_target numeric(12,2),
  active         boolean default true,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (business_id, slug)
);

-- ---------------------------------------------------------------------------
-- Segment revenue (actuals vs targets, per period)
-- ---------------------------------------------------------------------------
create table if not exists public.segment_revenue (
  id             bigint generated always as identity primary key,
  segment_id     bigint not null references public.segments(id) on delete cascade,
  period_start   timestamptz not null,
  period_end     timestamptz not null,
  revenue_actual numeric(12,2),
  revenue_target numeric(12,2),
  expenses       numeric(12,2),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists segment_revenue_segment_id_idx on public.segment_revenue(segment_id);

-- ---------------------------------------------------------------------------
-- Segment dimension health (the 12 dimensions, scored per segment)
-- ---------------------------------------------------------------------------
create table if not exists public.segment_dimensions (
  id            bigint generated always as identity primary key,
  segment_id    bigint not null references public.segments(id) on delete cascade,
  dimension_key varchar(50) not null,
  score         integer not null,
  health        health default 'healthy',
  notes         text,
  updated_by    varchar(100),
  updated_at    timestamptz default now()
);
create index if not exists segment_dimensions_segment_id_idx on public.segment_dimensions(segment_id);

-- ---------------------------------------------------------------------------
-- Tasks (segment- and dimension-aware)
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id                              bigint generated always as identity primary key,
  title                           varchar(255) not null,
  description                     text,
  status                          task_status default 'backlog',
  priority                        priority default 'medium',
  business_id                     bigint references public.businesses(id) on delete set null,
  segment_id                      bigint references public.segments(id) on delete set null,
  dimension_marketing             boolean default false,
  dimension_sales                 boolean default false,
  dimension_operations            boolean default false,
  dimension_finance               boolean default false,
  dimension_team                  boolean default false,
  dimension_systems               boolean default false,
  dimension_leadership            boolean default false,
  dimension_vision                boolean default false,
  dimension_product               boolean default false,
  dimension_customer_experience   boolean default false,
  dimension_legal                 boolean default false,
  dimension_sustainability        boolean default false,
  board_position                  integer default 0,
  due_date                        timestamptz,
  completed_at                    timestamptz,
  created_at                      timestamptz default now(),
  updated_at                      timestamptz default now()
);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_segment_id_idx on public.tasks(segment_id);

-- ---------------------------------------------------------------------------
-- Dashboard layouts (per-user drag-and-drop customization)
-- ---------------------------------------------------------------------------
create table if not exists public.dashboard_layouts (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid(),
  layout_name   varchar(100) default 'default',
  layout_config jsonb not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security — enable on all new tables + authenticated-access policy
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'sacred_kaleidoscope','businesses','segments','segment_revenue',
    'segment_dimensions','tasks','dashboard_layouts'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true);',
      t || '_authenticated_all', t
    );
  end loop;
exception when duplicate_object then null;
end $$;
