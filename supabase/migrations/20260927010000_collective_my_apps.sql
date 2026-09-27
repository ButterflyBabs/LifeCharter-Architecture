-- Which other LifeCharter apps the signed-in member can open from the
-- Collective sidebar: Command Suite (owner/admin, their own Command Suite
-- account, or an invited team member) and the LifeCharter Program (enrolled).
create or replace function public.cm_my_apps()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'suite', cm_is_admin()
      or exists (select 1 from profiles where id = auth.uid())
      or exists (select 1 from workspace_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) and status in ('active', 'pending')),
    'program', cm_is_admin()
      or exists (select 1 from lcp_enrollments where user_id = auth.uid() and status in ('active', 'comp'))
  );
$$;
revoke all on function public.cm_my_apps() from public, anon;
grant execute on function public.cm_my_apps() to authenticated;
