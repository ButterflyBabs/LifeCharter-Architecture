-- Tasks and businesses (with their segments, dimensions and revenue) become
-- per-client. Also drops seven "any signed-in user can read/write everything"
-- policies: the app only reaches these tables server-side with the service
-- role, which bypasses RLS, so removing them changes nothing for the app and
-- closes direct access for every other signed-in user (e.g. Collective members).
drop policy if exists tasks_authenticated_all on public.tasks;
drop policy if exists businesses_authenticated_all on public.businesses;
drop policy if exists segments_authenticated_all on public.segments;
drop policy if exists segment_dimensions_authenticated_all on public.segment_dimensions;
drop policy if exists segment_revenue_authenticated_all on public.segment_revenue;
drop policy if exists dashboard_layouts_authenticated_all on public.dashboard_layouts;
drop policy if exists sacred_kaleidoscope_authenticated_all on public.sacred_kaleidoscope;

alter table public.tasks
  add column if not exists master_plan_id uuid references public.client_master_plans(id) on delete cascade;
alter table public.businesses
  add column if not exists master_plan_id uuid references public.client_master_plans(id) on delete cascade;

-- Existing rows belong to the founding ('Primary') plan.
update public.businesses
  set master_plan_id = (select id from public.client_master_plans where client_name = 'Primary' order by created_at limit 1)
  where master_plan_id is null;
update public.tasks
  set master_plan_id = (select id from public.client_master_plans where client_name = 'Primary' order by created_at limit 1)
  where master_plan_id is null;

create index if not exists tasks_plan_status_idx on public.tasks (master_plan_id, status);
create index if not exists businesses_plan_idx on public.businesses (master_plan_id);
