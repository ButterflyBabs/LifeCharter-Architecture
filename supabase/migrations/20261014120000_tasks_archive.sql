-- Done tasks can be archived: they leave the Tasks board but stay in the table, so completion history,
-- follow-through health and the activity log are unchanged. archived_at is null for everything on the board.
alter table public.tasks add column if not exists archived_at timestamptz;
create index if not exists tasks_plan_archived_idx on public.tasks (master_plan_id) where archived_at is not null;
