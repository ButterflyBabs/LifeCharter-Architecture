-- Affiliate product links last 365 days, then lapse unless renewed. A notice goes to the
-- account owner and the affiliate 30 days before (expiry_notified_at makes it once per term).
alter table affiliate_links add column if not exists expires_at timestamptz;
alter table affiliate_links add column if not exists expiry_notified_at timestamptz;
update affiliate_links set expires_at = created_at + interval '365 days' where expires_at is null;
alter table affiliate_links alter column expires_at set default (now() + interval '365 days');
