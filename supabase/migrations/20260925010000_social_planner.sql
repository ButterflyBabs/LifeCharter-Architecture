-- Social Planner (Marketing Plan → Social Planner, Daily Compass → Content Calendar).
--
-- The Content Calendar had no table of its own: /api/content/posts proxies
-- PostStream directly. social_posts is the planning store the calendar now
-- reads alongside PostStream; a planned post is linked to its PostStream copy
-- through poststream_post_id once it is scheduled (Phase 2).
--
-- Every table is per account (master_plan_id), RLS on with no policies:
-- service-role only, read and written through server routes that scope by
-- resolveMasterPlanId() — the same pattern as sales_activities.
-- Additive + idempotent.

-- Planned posts, one row per post per platform.
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  external_id text,                          -- import key (e.g. 'w1-01'); null for posts made in the app
  planned_date date not null,
  platform text not null,                    -- facebook | instagram | linkedin | youtube | spotify | tiktok | …
  format text not null default 'post',       -- post | photo | carousel | reel | story | episode | long video | …
  status text not null default 'draft',      -- idea | draft | scheduled | posted
  title text not null default '',
  notes text not null default '',            -- captions, scripts, story frames (plain text, ALL-CAPS section headings)
  image_prompt text not null default '',     -- ChatGPT graphic prompt
  link text not null default '',             -- live link once posted
  series text not null default '',
  invite_level text,                         -- give | light | invite (null = not labelled)
  offer_key text,                            -- social_offers.key this post points to
  poststream_post_id text,                   -- set when scheduled through PostStream (Phase 2)
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_posts_status_chk check (status in ('idea', 'draft', 'scheduled', 'posted')),
  constraint social_posts_invite_chk check (invite_level is null or invite_level in ('give', 'light', 'invite'))
);
-- Plain (not partial) unique index so upserts can target it; NULL external_ids never collide.
create unique index if not exists social_posts_external_uniq on public.social_posts (master_plan_id, external_id);
create index if not exists social_posts_mpid_date_idx on public.social_posts (master_plan_id, planned_date);
alter table public.social_posts enable row level security;

-- One settings document per account: which platforms it plans for, weekly
-- goals (shape of settings/goals.json), and content rules (voice, sign-off,
-- give:invite ratio, series, word rules, personal-detail policy).
create table if not exists public.social_settings (
  master_plan_id uuid primary key,
  platforms text[] not null default '{}',
  goals jsonb not null default '{}'::jsonb,
  rules jsonb not null default '{}'::jsonb,
  setup_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.social_settings enable row level security;

-- Per account per week (Monday): manual metric actuals, habit check-offs by
-- date, and "what worked" notes.
create table if not exists public.social_weeks (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  week_start date not null,
  actuals jsonb not null default '{}'::jsonb,   -- { platform: { metricId: number } }
  habits jsonb not null default '{}'::jsonb,    -- { "platform.metricId": { "YYYY-MM-DD": true } }
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists social_weeks_uniq on public.social_weeks (master_plan_id, week_start);
alter table public.social_weeks enable row level security;

-- Audience benchmark + follow-up snapshots.
create table if not exists public.social_audience_snapshots (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  snap_date date not null,
  is_baseline boolean not null default false,
  metrics jsonb not null default '{}'::jsonb,  -- { platform: { metricId: number } }
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists social_audience_uniq on public.social_audience_snapshots (master_plan_id, snap_date);
alter table public.social_audience_snapshots enable row level security;

-- The account's offers / doorways.
create table if not exists public.social_offers (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  key text not null,                          -- stable slug, referenced by social_posts.offer_key
  name text not null default '',
  link text not null default '',
  kind text not null default 'always-open',   -- event | always-open | invite-only | private
  rules text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_offers_kind_chk check (kind in ('event', 'always-open', 'invite-only', 'private'))
);
create unique index if not exists social_offers_uniq on public.social_offers (master_plan_id, key);
alter table public.social_offers enable row level security;

-- Dated events (a MasterClass session, an Incubator…).
create table if not exists public.social_events (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  offer_key text,
  title text not null default '',
  event_date date not null,
  start_time time,
  timezone text not null default 'UTC',            -- IANA zone; the app fills in the owner's own
  first_mention_on date,                      -- don't promote before this date
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists social_events_uniq on public.social_events (master_plan_id, offer_key, event_date);
create index if not exists social_events_mpid_date_idx on public.social_events (master_plan_id, event_date);
alter table public.social_events enable row level security;
