-- Which house brand a public booking page wears (command_suite, lifecharter or amilynne). Only the house account's
-- calendars use it; every client account's booking pages stay neutral (no LifeCharter logo or colors).
alter table public.booking_calendars add column if not exists brand text not null default 'command_suite';
update public.booking_calendars set brand='lifecharter' where master_plan_id='acc142bf-68d5-4d44-97dc-f25b00a3cef1' and slug='next-chapter-call';
update public.booking_calendars set brand='amilynne' where master_plan_id='acc142bf-68d5-4d44-97dc-f25b00a3cef1' and slug in ('collaboration-call','investor-interest');
