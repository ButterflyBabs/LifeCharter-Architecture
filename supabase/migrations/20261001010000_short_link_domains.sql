-- Each account can point its OWN domain at its short links (go.theirbusiness.com)
-- instead of sharing lccommandsuite.com/l/ with every other account — the same
-- "bring your own domain" shape already used for email sending.
alter table client_master_plans add column if not exists short_link_domain text unique;
alter table client_master_plans add column if not exists short_link_domain_status text not null default 'not_started'
  check (short_link_domain_status in ('not_started', 'pending', 'verified', 'failed'));
alter table client_master_plans add column if not exists short_link_domain_verification jsonb not null default '[]'::jsonb;
alter table client_master_plans add column if not exists short_link_domain_checked_at timestamptz;
