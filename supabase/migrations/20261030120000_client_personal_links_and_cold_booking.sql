-- Each account's own destinations: where an Outreach Pipeline's personal links go, and the booking link in its cold emails.
alter table public.pipeline_boards add column if not exists personal_link_url text;
alter table public.cold_email_settings add column if not exists booking_url text;
