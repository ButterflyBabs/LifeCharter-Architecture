-- Energy attribute per task: how much energy a task takes (low | medium | high).
-- The Daily Compass energy selector matches your current energy to fitting tasks.
alter table public.tasks add column if not exists energy text default 'medium';
