-- Facebook Lead Ads (through Make) hands over the Ad ID, not the ad's name. Keep the ID on each lead and map IDs to the names
-- used in Ads Manager so the weekly report can count leads per ad.
alter table public.meta_leads add column if not exists ad_id text;
create table if not exists public.meta_ad_names (
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  ad_id text not null,
  ad_name text not null,
  created_at timestamptz not null default now(),
  primary key (master_plan_id, ad_id)
);
alter table public.meta_ad_names enable row level security;
