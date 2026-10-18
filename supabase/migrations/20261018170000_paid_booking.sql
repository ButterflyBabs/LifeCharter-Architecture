-- Get paid inside the Suite, step c (task 1146): paid and deposit booking.
-- A calendar can ask for the full price or a deposit when someone books. The time is held for 30 minutes as
-- "pending_payment" while they pay on the client's OWN Stripe account (Checkout, direct charge, no platform fee);
-- the Connect webhook confirms it (emails, calendar event, contact, deal) the moment Stripe says it's paid.
alter table public.booking_calendars
  add column if not exists pay_mode text not null default 'none' check (pay_mode in ('none','full','deposit')),
  add column if not exists price numeric(12,2),
  add column if not exists deposit numeric(12,2);

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check check (status in ('confirmed','canceled','rescheduled','completed','no_show','pending_payment'));
alter table public.bookings
  add column if not exists pay_amount numeric(12,2),        -- what they were asked to pay when booking
  add column if not exists paid_amount numeric(12,2),       -- what Stripe confirmed
  add column if not exists pay_session_id text,             -- the Checkout session on the client's account
  add column if not exists pay_expires_at timestamptz,      -- an unpaid hold is released after this
  add column if not exists pending_token text;              -- the manage link, kept only until payment confirms (for the emails)

-- A held (unpaid) time blocks the slot exactly like a confirmed one.
drop index if exists public.bookings_host_slot;
create unique index if not exists bookings_host_slot on public.bookings (host_id, start_at) where status in ('confirmed','pending_payment');

alter table public.suite_payments drop constraint if exists suite_payments_kind_check;
alter table public.suite_payments add constraint suite_payments_kind_check check (kind in ('link','invoice','plan','subscription','booking'));
