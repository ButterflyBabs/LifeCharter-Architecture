-- iPhone app push tokens (Apple Push Notification service). The notify cron
-- sends each unpushed notification to the member's web-push subscriptions
-- and to these devices. env flips to 'sandbox' automatically for dev builds.
create table if not exists public.cm_apns_devices (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  env text not null default 'production' check (env in ('production', 'sandbox')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cm_apns_devices_user_idx on public.cm_apns_devices (user_id);
alter table public.cm_apns_devices enable row level security;
create policy cm_apns_devices_own on public.cm_apns_devices for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and cm_in_collective());
