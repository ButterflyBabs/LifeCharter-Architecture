-- The demo reset snapshots every table with a master_plan_id. CRM child tables
-- (campaign emails and people, broadcast sends, form sign-ups) hang off a parent
-- instead, so they were lost on each hourly reset. Snapshot them through their
-- parent, and keep the tag-history trigger quiet while the reset restores rows.

create or replace function crm_log_tag_changes() returns trigger language plpgsql as $$
declare
  t text;
  src text;
begin
  if current_setting('app.demo_restore', true) = '1' then return new; end if;
  if tg_op = 'INSERT' then
    src := coalesce(new.tag_source, new.source);
    foreach t in array coalesce(new.tags, '{}') loop
      insert into crm_tag_history (master_plan_id, contact_id, tag, action, source) values (new.master_plan_id, new.id, t, 'added', src);
    end loop;
  elsif new.tags is distinct from old.tags then
    src := new.tag_source;
    foreach t in array coalesce(new.tags, '{}') loop
      if not (t = any(coalesce(old.tags, '{}'))) then
        insert into crm_tag_history (master_plan_id, contact_id, tag, action, source) values (new.master_plan_id, new.id, t, 'added', src);
      end if;
    end loop;
    foreach t in array coalesce(old.tags, '{}') loop
      if not (t = any(coalesce(new.tags, '{}'))) then
        insert into crm_tag_history (master_plan_id, contact_id, tag, action, source) values (new.master_plan_id, new.id, t, 'removed', src);
      end if;
    end loop;
  end if;
  return new;
end $$;

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
  -- CRM children, through their parent.
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
  return saved;
end $function$;

-- demo_reset: unchanged except it tells the tag-history trigger a restore is running.
do $do$
declare d text;
begin
  d := pg_get_functiondef('public.demo_reset'::regproc);
  if position('app.demo_restore' in d) = 0 then
    d := replace(d, E'begin\n  if v_demo is null', E'begin\n  perform set_config(''app.demo_restore'', ''1'', true);\n  if v_demo is null');
    execute d;
  end if;
end $do$;
