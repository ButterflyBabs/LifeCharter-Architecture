-- Client isolation check (Command Suite Audit, cs160). Run in the Supabase SQL editor or via MCP execute_sql.
-- Signs in (inside a transaction that is rolled back) as a brand-new client who owns nothing, and counts,
-- for every public table keyed by master_plan_id / user_id / owner_id / workspace_id, the rows they can see
-- that belong to someone else. PASS = no rows returned. (Sanity check: run the SELECT at the bottom
-- without the two SET LOCAL lines and it lists every table holding other people's data.)
-- Tables that are shared on purpose (pricing tiers in public.plans; Collective posts for members) only
-- show up for a stranger if their policies leak, so any row here needs a look.
-- 2026-09-27 result: PASS (0 visible, vs 897 rows across 42 tables with full access).
begin;
create function pg_temp.leaks(p_self uuid, p_plan uuid) returns table(tbl text, col text, visible bigint) language plpgsql as $f$
declare r record; n bigint;
begin
  for r in
    select c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
      and c.column_name in ('master_plan_id', 'user_id', 'owner_id', 'workspace_id')
  loop
    begin
      if r.column_name = 'master_plan_id' then
        execute format('select count(*) from public.%I where master_plan_id is distinct from $1', r.table_name) into n using p_plan;
      elsif r.column_name = 'workspace_id' then
        execute format('select count(*) from public.%I where workspace_id is not null', r.table_name) into n;
      else
        execute format('select count(*) from public.%I where %I is distinct from $1', r.table_name, r.column_name) into n using p_self;
      end if;
      if n > 0 then tbl := r.table_name; col := r.column_name; visible := n; return next; end if;
    exception when others then
      if sqlstate <> '42501' then tbl := r.table_name; col := 'error: ' || sqlerrm; visible := -1; return next; end if;
    end;
  end loop;
end $f$;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-2222-3333-4444-555555555555","role":"authenticated","email":"isolation-test@example.com"}';
select * from pg_temp.leaks('11111111-2222-3333-4444-555555555555', '99999999-9999-9999-9999-999999999999') order by 1, 2;
rollback;
