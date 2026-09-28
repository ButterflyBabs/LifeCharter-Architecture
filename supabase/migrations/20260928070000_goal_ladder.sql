-- Cascading goals: a plan goal can be broken into quarter → month → week goals.
alter table public.client_plan_goals add column if not exists period text not null default 'year';
alter table public.client_plan_goals add column if not exists parent_id uuid references public.client_plan_goals(id) on delete cascade;
alter table public.client_plan_goals add column if not exists period_start date;
do $$ begin
  alter table public.client_plan_goals add constraint client_plan_goals_period_check check (period in ('year','quarter','month','week'));
exception when duplicate_object then null; end $$;
create index if not exists client_plan_goals_parent on public.client_plan_goals (parent_id);
