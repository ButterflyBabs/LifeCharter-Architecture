-- A client can have more than one website reviewed: Starter 1, Growth 2, VIP 5 (plans.capabilities.website_reviews).
alter table website_reviews drop constraint if exists website_reviews_pkey;
alter table website_reviews add column if not exists id uuid not null default gen_random_uuid();
alter table website_reviews add primary key (id);
alter table website_reviews add column if not exists created_at timestamptz not null default now();
update website_reviews set website = '' where website is null;
alter table website_reviews alter column website set not null;
create unique index if not exists website_reviews_plan_site_idx on website_reviews (master_plan_id, lower(website));
update plans set capabilities = capabilities || '{"website_reviews": 1}'::jsonb where id = 'starter';
update plans set capabilities = capabilities || '{"website_reviews": 2}'::jsonb where id = 'growth';
update plans set capabilities = capabilities || '{"website_reviews": 5}'::jsonb where id = 'vip';
