-- Scheduled follow-ups are unified into tasks: a follow-up is a task with a
-- precise due time (due_at) and follow-up metadata (channel, linked contact,
-- AI mode, GC workflow tag, calendar option) in the followup jsonb.
alter table public.tasks
  add column if not exists due_at timestamptz,
  add column if not exists followup jsonb not null default '{}'::jsonb;
