-- Lock down the Collective's SECURITY DEFINER functions: nothing is callable
-- signed out except the /join preview; trigger functions aren't callable at all.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'cm\_%' loop
    execute format('revoke all on function %s from public, anon', f.sig);
    if f.proname in ('cm_posts_guard','cm_comments_guard','cm_comments_count','cm_reactions_guard','cm_profiles_guard',
                     'cm_space_members_guard','cm_dm_messages_after','cm_notify_post','cm_notify_comment','cm_notify_dm','cm_ensure_member') then
      execute format('revoke all on function %s from authenticated', f.sig);
    else
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
  grant execute on function public.cm_join_preview(text) to anon;
end $$;
