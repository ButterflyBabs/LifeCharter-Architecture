alter table public.social_posts
  add column if not exists scheduled_at timestamptz,
  add column if not exists media_urls jsonb not null default '[]'::jsonb,
  add column if not exists media_type text;

alter table public.social_posts
  add constraint social_posts_ps_unique unique (master_plan_id, poststream_post_id, platform);

-- PostStream posts a client removed from their plan, so the calendar sync
-- doesn't bring them back.
create table if not exists public.social_ps_ignored (
  master_plan_id uuid not null,
  poststream_post_id text not null,
  created_at timestamptz not null default now(),
  primary key (master_plan_id, poststream_post_id)
);
alter table public.social_ps_ignored enable row level security;
