-- Real recurring events. The row holds the first session; recur_* describe
-- the rule and the app expands sessions in the event's time zone.
alter table public.cm_events
  add column if not exists recur_freq text check (recur_freq in ('daily','weekdays','weekly','biweekly','monthly_date','monthly_weekday')),
  add column if not exists recur_until date,
  add column if not exists recur_exdates date[] not null default '{}';
-- Reminders are per session: remember which session we last reminded about.
alter table public.cm_event_rsvps add column if not exists reminded_for timestamptz;
create index if not exists cm_events_recurring_idx on public.cm_events (recur_until) where recur_freq is not null and deleted_at is null;
