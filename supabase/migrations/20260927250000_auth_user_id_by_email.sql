-- Find an existing login by email (one login across Command Shift, the Collective, the LifeCharter Program and Command Suite).
-- Service role only: used when provisioning a Command Suite account for someone who already has a login.
create or replace function public.auth_user_id_by_email(p_email text)
returns uuid
language sql stable security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
$$;
revoke all on function public.auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.auth_user_id_by_email(text) to service_role;
