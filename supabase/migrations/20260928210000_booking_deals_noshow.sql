-- Booking calendars can open a Pipeline deal per booking (won on purchase,
-- lost on cancel / no-show) and send a no-show follow-up email.
alter table public.booking_calendars add column if not exists create_deal boolean not null default false;
alter table public.booking_calendars add column if not exists deal_value numeric(12,2);
alter table public.booking_calendars add column if not exists noshow_subject text;
alter table public.booking_calendars add column if not exists noshow_body text;
alter table public.bookings add column if not exists deal_id uuid references public.pipeline_deals(id) on delete set null;
