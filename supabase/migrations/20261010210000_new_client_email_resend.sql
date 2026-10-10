-- New Client Accounts: resend a "your account is ready" email that was already sent
-- (a fresh single-use password link goes with it). Counts and the last time are kept.
alter table new_client_emails add column if not exists resend_count integer not null default 0;
alter table new_client_emails add column if not exists last_resent_at timestamptz;
