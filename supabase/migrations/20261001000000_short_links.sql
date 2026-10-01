-- Short links: a Bitly/Short.io-style link shortener built into the Suite.
-- lccommandsuite.com/l/<code> -> the destination URL, with a click count.
-- Shared code namespace across every account (first come, first served),
-- same convention already used for affiliate codes and calendar slugs.
create table if not exists short_links (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  code text not null unique,
  destination_url text not null,
  title text,
  active boolean not null default true,
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists short_links_plan on short_links (master_plan_id, created_at desc);
alter table short_links enable row level security;

create table if not exists short_link_clicks (
  id bigint generated always as identity primary key,
  short_link_id uuid not null references short_links(id) on delete cascade,
  master_plan_id uuid not null,
  referrer text,
  created_at timestamptz not null default now()
);
create index if not exists short_link_clicks_link on short_link_clicks (short_link_id, created_at desc);
alter table short_link_clicks enable row level security;
