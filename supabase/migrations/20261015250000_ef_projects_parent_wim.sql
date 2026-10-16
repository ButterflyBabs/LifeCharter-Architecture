-- Embraced;Fully projects can sit under a parent project (one level, as in the old Wings in Motion tracker), and rows
-- brought over from that tracker remember the old id so the move can be repeated safely.
alter table public.ef_projects add column if not exists parent_id uuid references public.ef_projects(id) on delete set null;
alter table public.ef_projects add column if not exists wim_id text;
alter table public.ef_tasks add column if not exists wim_id text;
create unique index if not exists ef_projects_wim_idx on public.ef_projects (master_plan_id, wim_id) where wim_id is not null;
create unique index if not exists ef_tasks_wim_idx on public.ef_tasks (master_plan_id, wim_id) where wim_id is not null;
