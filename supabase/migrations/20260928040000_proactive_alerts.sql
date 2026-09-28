-- Proactive alerts: remember which alerts were already emailed, and let each owner turn the daily alert email off.
alter table public.notifications add column if not exists emailed_at timestamptz;
alter table public.profiles add column if not exists alert_email boolean not null default true;
