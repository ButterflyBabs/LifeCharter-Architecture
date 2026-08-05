-- Per-client daily activity ledger for the Compass "Today's Activity" panel.
-- Global Control has no endpoint to log calls/follow-ups or store notes, so the
-- app is the ledger: each logged call/follow-up (with an optional note) against
-- a Global Control contact is recorded here, scoped by the client's master plan.
create table if not exists public.contact_activity_log (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid,
  contact_id text,          -- Global Control contact id (when logged from a contact)
  contact_name text,        -- denormalized for display
  type text not null default 'call',   -- 'call' | 'followup'
  note text,
  created_at timestamptz not null default now()
);
create index if not exists contact_activity_log_plan_time
  on public.contact_activity_log (master_plan_id, created_at desc);
alter table public.contact_activity_log enable row level security;
