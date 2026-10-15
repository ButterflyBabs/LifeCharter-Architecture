-- Assistant work reports: what the assistant did on a task or a reminder, what it found, and the next steps
-- (who does each: the Suite itself, the assistant, the client, or both). One row per saved report; the newest
-- one per item is shown on the item's own page, older ones stay as history.
create table if not exists public.assistant_reports (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  item_type text not null,                      -- 'task' | 'reminder'
  item_key text not null,                       -- the task id or reminder id, as text
  item_title text not null default '',
  report jsonb not null,                        -- {done:[], found:[{label,value}], next_steps:[{text,who,when,status}], summary}
  related_action_ids uuid[] not null default '{}',   -- the cards prepared in the same reply (live status is read from them)
  created_at timestamptz not null default now()
);
create index if not exists assistant_reports_item_idx on public.assistant_reports (master_plan_id, item_type, item_key, created_at desc);
alter table public.assistant_reports enable row level security;
