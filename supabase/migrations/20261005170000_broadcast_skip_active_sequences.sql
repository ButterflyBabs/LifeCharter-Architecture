-- A broadcast can leave out anyone who is still in the middle of chosen campaigns (by campaign key),
-- so someone receiving a follow-up series isn't also sent the next promotion.
alter table public.crm_broadcasts add column if not exists skip_active_sequences text[] not null default '{}';
