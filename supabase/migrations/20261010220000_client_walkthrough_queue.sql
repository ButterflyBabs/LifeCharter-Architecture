-- New client setup walkthrough: every new client account is queued here with a send time about 3 minutes
-- after the account is created; a once-a-minute job sends it (only when app_settings client_walkthrough_on = true).
-- One row per email address, so it can only ever go once per person.
create table if not exists client_walkthrough_queue (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid,
  name text,
  due_at timestamptz not null,
  sent_at timestamptz,
  skipped_reason text,
  result text,
  created_at timestamptz not null default now()
);
create index if not exists client_walkthrough_queue_due_idx on client_walkthrough_queue (due_at) where sent_at is null and skipped_reason is null;
alter table client_walkthrough_queue enable row level security;
