-- Event sign-ups: an optional mobile number and a separate, unchecked agreement to text reminders (up to one text a day of a live workshop).
alter table public.event_registrations
  add column if not exists phone text,
  add column if not exists sms_ok boolean not null default false,
  add column if not exists sms_last_day int not null default 0;
comment on column public.event_registrations.sms_ok is 'The person ticked the separate, unchecked box agreeing to text reminders for this event. Texts go only to rows where this is true.';
