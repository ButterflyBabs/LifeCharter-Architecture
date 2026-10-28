-- A sending mailbox can send as more than one address: Google domain aliases give one mailbox an address on every extra domain.
-- send_as holds that address; each one is its own sender row with its own daily ramp and cap, all through the same Google connection.
alter table public.cold_email_senders add column if not exists send_as text;
alter table public.cold_email_senders drop constraint if exists cold_email_senders_master_plan_id_account_key_key;
create unique index if not exists cold_email_senders_mailbox_address on public.cold_email_senders (master_plan_id, account_key, coalesce(send_as, ''));
