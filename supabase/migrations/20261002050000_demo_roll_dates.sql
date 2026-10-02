-- The demo's sample data is dated around the day it was made. So it never goes stale,
-- every reset first moves the saved copy's dates forward by however many days have
-- passed: Finance always has a current month, the Content Calendar always has a "today",
-- recent messages stay recent. Columns named week… (week_of, week_start) move in whole
-- weeks so they stay on their weekday. The accountability partner sits outside the
-- snapshot, so its rows are moved in place by the same amounts.
create table if not exists public.demo_state (
  id int primary key default 1 check (id = 1),
  base_on date not null,
  applied_days int not null default 0,
  applied_week_days int not null default 0
);
alter table public.demo_state enable row level security;
insert into public.demo_state (id, base_on) values (1, date '2026-10-02') on conflict (id) do nothing;


-- demo_roll_dates(), and demo_reset() / demo_snapshot_take() updated to use it.
CREATE OR REPLACE FUNCTION public.demo_roll_dates(p_today date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'demo_snapshot'
AS $function$
declare
  v_demo uuid := public.demo_plan_id();
  v_today date := coalesce(p_today, (now() at time zone 'America/Denver')::date);
  s public.demo_state%rowtype;
  total int; d_day int; d_week int; r record; scope text;
  far constant int := 70000; -- a whole number of weeks, far past any real date
begin
  select * into s from public.demo_state where id = 1 for update;
  if not found then return jsonb_build_object('rolled', 0); end if;
  total := greatest(v_today - s.base_on, 0);
  d_day := total - s.applied_days;
  d_week := (total / 7) * 7 - s.applied_week_days;
  if d_day <= 0 and d_week <= 0 then return jsonb_build_object('rolled', 0); end if;

  -- The saved copy (everything the reset restores). Plain tables, no constraints.
  for r in
    select c.table_name,
      string_agg(format('%1$I = %1$I + %2$s', c.column_name,
        case when c.data_type = 'date' then (case when c.column_name like 'week%' then d_week else d_day end)::text
             else format('interval ''%s days''', case when c.column_name like 'week%' then d_week else d_day end) end), ', ') as sets
    from information_schema.columns c
    where c.table_schema = 'demo_snapshot' and c.data_type in ('date', 'timestamp with time zone', 'timestamp without time zone')
    group by c.table_name
  loop
    execute format('update demo_snapshot.%I set %s', r.table_name, r.sets);
  end loop;

  -- The accountability partner (not part of the snapshot): moved where it lives. Two steps
  -- (far forward, then back) so a unique week never collides with a row not yet moved.
  for r in
    select c.table_name,
      string_agg(format('%1$I = %1$I + %2$s', c.column_name,
        case when c.data_type = 'date' then ((case when c.column_name like 'week%' then d_week else d_day end) + far)::text
             else format('interval ''%s days''', (case when c.column_name like 'week%' then d_week else d_day end) + far) end), ', ')
        filter (where c.column_name <> 'partnership_id') as sets_far,
      string_agg(format('%1$I = %1$I - %2$s', c.column_name,
        case when c.data_type = 'date' then far::text else format('interval ''%s days''', far) end), ', ')
        filter (where c.column_name <> 'partnership_id') as sets_back,
      bool_or(c.column_name = 'partnership_id') as child
    from information_schema.columns c
    where c.table_schema = 'public' and c.table_name like 'accountability\_%'
      and (c.data_type in ('date', 'timestamp with time zone', 'timestamp without time zone') or c.column_name = 'partnership_id')
    group by c.table_name
  loop
    continue when r.sets_far is null;
    if r.table_name = 'accountability_partnerships' then scope := format('a_plan_id = %L', v_demo);
    elsif r.child then scope := format('partnership_id in (select id from public.accountability_partnerships where a_plan_id = %L)', v_demo);
    else continue;
    end if;
    execute format('update public.%I set %s where %s', r.table_name, r.sets_far, scope);
    execute format('update public.%I set %s where %s', r.table_name, r.sets_back, scope);
  end loop;

  update public.demo_state set applied_days = total, applied_week_days = (total / 7) * 7 where id = 1;
  return jsonb_build_object('rolled', d_day, 'weeks_rolled', d_week / 7);
end $function$
;
revoke all on function public.demo_roll_dates(date) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.demo_reset()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'demo_snapshot'
AS $function$
declare
  v_demo uuid := public.demo_plan_id();
  t text; cols text; pass int; pending text[]; still text[]; n bigint;
  restored jsonb := '{}'::jsonb;
begin
  perform set_config('app.demo_restore', '1', true);
  set constraints all deferred;
  if v_demo is null then raise exception 'demo plan not found'; end if;
  if not exists (select 1 from pg_tables where schemaname = 'demo_snapshot' and tablename = 'client_master_plans') then
    raise exception 'no demo snapshot; run demo_snapshot_take() first';
  end if;

  -- Keep the sample data current: move the saved copy's dates forward to today first.
  perform public.demo_roll_dates();

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

  foreach t in array array['client_master_plans', 'workspaces'] loop
    select string_agg(format('%1$I = s.%1$I', s.column_name), ', ') into cols
    from information_schema.columns s
    join information_schema.columns p on p.table_schema = 'public' and p.table_name = s.table_name and p.column_name = s.column_name
    where s.table_schema = 'demo_snapshot' and s.table_name = t and s.column_name <> 'id' and p.is_generated = 'NEVER' and p.is_identity = 'NO';
    execute format('update public.%1$I d set %2$s from demo_snapshot.%1$I s where d.id = s.id', t, cols);
  end loop;

  return restored;
end $function$
;

CREATE OR REPLACE FUNCTION public.demo_snapshot_take()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'demo_snapshot'
AS $function$
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
  create table demo_snapshot.client_plan_goals as
    select g.* from public.client_plan_goals g join public.client_plans p on p.id = g.plan_id where p.master_plan_id = v_demo;
  create table demo_snapshot.sequence_steps as
    select s.* from public.sequence_steps s join public.sequences q on q.id = s.sequence_id where q.master_plan_id = v_demo;
  create table demo_snapshot.sequence_enrollments as
    select e.* from public.sequence_enrollments e join public.sequences q on q.id = e.sequence_id where q.master_plan_id = v_demo;
  create table demo_snapshot.sequence_sends as
    select x.* from public.sequence_sends x join public.sequence_enrollments e on e.id = x.enrollment_id join public.sequences q on q.id = e.sequence_id where q.master_plan_id = v_demo;
  create table demo_snapshot.crm_broadcast_sends as
    select x.* from public.crm_broadcast_sends x join public.crm_broadcasts b on b.id = x.broadcast_id where b.master_plan_id = v_demo;
  create table demo_snapshot.crm_submissions as
    select x.* from public.crm_submissions x join public.crm_forms f on f.id = x.form_id where f.master_plan_id = v_demo;
  create table demo_snapshot.client_master_plans as select * from public.client_master_plans where id = v_demo;
  create table demo_snapshot.workspaces as select * from public.workspaces where master_plan_id = v_demo;
  -- A fresh copy is dated as of today: the date roll starts counting from here.
  update public.demo_state set base_on = (now() at time zone 'America/Denver')::date, applied_days = 0, applied_week_days = 0 where id = 1;
  return saved;
end $function$
;
