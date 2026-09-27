-- Demo reset (Babs chose option A, 2026-09-27): public /demo visitors can try anything; every hour
-- the shared demo business ("Demo — Brand Alchemy Studio") is restored to a saved snapshot, so their
-- changes disappear. demo_snapshot_take() saves the current demo as the baseline;
-- demo_reset() restores it. Both are service-role only (called by /api/cron/demo-reset).

create schema if not exists demo_snapshot;
revoke all on schema demo_snapshot from public, anon, authenticated;

create or replace function public.demo_plan_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.client_master_plans where client_name = 'Demo — Brand Alchemy Studio' limit 1;
$$;

-- Tables that hold a plan's data (keyed by master_plan_id), except the plan and workspace rows themselves.
create or replace function public.demo_plan_tables() returns setof text
language sql stable security definer set search_path = public as $$
  select c.table_name::text
  from information_schema.columns c
  join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
  where c.table_schema = 'public' and t.table_type = 'BASE TABLE' and c.column_name = 'master_plan_id'
    and c.table_name not in ('client_master_plans', 'workspaces');
$$;

create or replace function public.demo_snapshot_take() returns jsonb
language plpgsql security definer set search_path = public, demo_snapshot as $$
declare v_demo uuid := public.demo_plan_id(); t text; n bigint; saved jsonb := '{}'::jsonb;
begin
  if v_demo is null then raise exception 'demo plan not found'; end if;
  for t in select tablename from pg_tables where schemaname = 'demo_snapshot' loop
    execute format('drop table demo_snapshot.%I', t);
  end loop;
  for t in select * from public.demo_plan_tables() loop
    execute format('create table demo_snapshot.%I as select * from public.%I where master_plan_id = %L', t, t, v_demo);
    execute format('select count(*) from demo_snapshot.%I', t) into n;
    if n = 0 then execute format('drop table demo_snapshot.%I', t); else saved := saved || jsonb_build_object(t, n); end if;
  end loop;
  -- Goals hang off the demo's plans without their own master_plan_id.
  create table demo_snapshot.client_plan_goals as
    select g.* from public.client_plan_goals g join public.client_plans p on p.id = g.plan_id where p.master_plan_id = v_demo;
  create table demo_snapshot.client_master_plans as select * from public.client_master_plans where id = v_demo;
  create table demo_snapshot.workspaces as select * from public.workspaces where master_plan_id = v_demo;
  return saved;
end $$;

create or replace function public.demo_reset() returns jsonb
language plpgsql security definer set search_path = public, demo_snapshot as $$
declare
  v_demo uuid := public.demo_plan_id();
  t text; cols text; pass int; pending text[]; still text[]; n bigint;
  restored jsonb := '{}'::jsonb;
begin
  if v_demo is null then raise exception 'demo plan not found'; end if;
  if not exists (select 1 from pg_tables where schemaname = 'demo_snapshot' and tablename = 'client_master_plans') then
    raise exception 'no demo snapshot; run demo_snapshot_take() first';
  end if;

  -- 1. Remove everything in the demo (seeded and visitor-added). Several passes, for linked rows.
  pending := array(select * from public.demo_plan_tables());
  for pass in 1..6 loop
    still := '{}';
    foreach t in array pending loop
      begin
        execute format('delete from public.%I where master_plan_id = %L', t, v_demo);
      exception when foreign_key_violation then still := still || t;
      end;
    end loop;
    pending := still;
    exit when cardinality(pending) = 0;
  end loop;
  if cardinality(pending) > 0 then raise exception 'demo reset could not clear: %', pending; end if;

  -- 2. Put the snapshot back, keeping the original ids. Only columns that still exist in both.
  pending := array(select tablename::text from pg_tables where schemaname = 'demo_snapshot' and tablename not in ('client_master_plans', 'workspaces'));
  for pass in 1..6 loop
    still := '{}';
    foreach t in array pending loop
      select string_agg(quote_ident(s.column_name), ', ' order by s.ordinal_position) into cols
      from information_schema.columns s
      join information_schema.columns p on p.table_schema = 'public' and p.table_name = s.table_name and p.column_name = s.column_name
      where s.table_schema = 'demo_snapshot' and s.table_name = t and p.is_generated = 'NEVER';
      begin
        execute format('insert into public.%I (%s) overriding system value select %s from demo_snapshot.%I on conflict do nothing', t, cols, cols, t);
        execute format('select count(*) from demo_snapshot.%I', t) into n;
        restored := restored || jsonb_build_object(t, n);
      exception when foreign_key_violation then still := still || t;
      end;
    end loop;
    pending := still;
    exit when cardinality(pending) = 0;
  end loop;
  if cardinality(pending) > 0 then raise exception 'demo reset could not restore: %', pending; end if;

  -- 3. Put the demo's own plan and workspace settings back (they are updated, never deleted).
  foreach t in array array['client_master_plans', 'workspaces'] loop
    select string_agg(format('%1$I = s.%1$I', s.column_name), ', ') into cols
    from information_schema.columns s
    join information_schema.columns p on p.table_schema = 'public' and p.table_name = s.table_name and p.column_name = s.column_name
    where s.table_schema = 'demo_snapshot' and s.table_name = t and s.column_name <> 'id' and p.is_generated = 'NEVER' and p.is_identity = 'NO';
    execute format('update public.%1$I d set %2$s from demo_snapshot.%1$I s where d.id = s.id', t, cols);
  end loop;

  return restored;
end $$;

revoke all on function public.demo_plan_id() from public, anon, authenticated;
revoke all on function public.demo_plan_tables() from public, anon, authenticated;
revoke all on function public.demo_snapshot_take() from public, anon, authenticated;
revoke all on function public.demo_reset() from public, anon, authenticated;
grant execute on function public.demo_snapshot_take() to service_role;
grant execute on function public.demo_reset() to service_role;
