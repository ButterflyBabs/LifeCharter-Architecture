-- Demo support tickets survive the hourly reset; answered questions get a shared, anonymised log.
create or replace function public.demo_plan_tables() returns setof text
language sql stable security definer set search_path = public as $$
  select c.table_name::text
  from information_schema.columns c
  join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
  where c.table_schema = 'public' and t.table_type = 'BASE TABLE' and c.column_name = 'master_plan_id'
    and c.table_name not in ('client_master_plans', 'workspaces', 'support_requests');
$$;
alter table public.feedback_items drop constraint if exists feedback_items_kind_check;
alter table public.feedback_items add constraint feedback_items_kind_check check (kind in ('glitch', 'suggestion', 'feedback', 'update', 'resolved'));
-- The demo's two tickets (one resolved + shared log entry, one client-specific) were inserted directly.
