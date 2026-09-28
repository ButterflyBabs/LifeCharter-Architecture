-- A task can be assigned to one team member of the account (null = the owner's own).
alter table public.tasks add column if not exists assignee_member_id uuid references public.workspace_members(id) on delete set null;
create index if not exists tasks_assignee_idx on public.tasks (assignee_member_id) where assignee_member_id is not null;
