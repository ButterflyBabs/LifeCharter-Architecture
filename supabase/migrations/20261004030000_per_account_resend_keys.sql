-- Each client account connects its OWN Resend account for email to its own contacts.
-- The key lives in Vault (encrypted at rest); the plan keeps only the secret's id. Server-only.
alter table public.client_master_plans add column if not exists resend_key_secret_id uuid;

create or replace function public.set_account_resend_key(p_plan uuid, p_key text)
returns void language plpgsql security definer set search_path = public, vault as $$
declare v_secret uuid;
begin
  select resend_key_secret_id into v_secret from public.client_master_plans where id = p_plan;
  if not found then raise exception 'no plan for %', p_plan; end if;
  if coalesce(btrim(p_key), '') = '' then
    if v_secret is not null then delete from vault.secrets where id = v_secret; end if;
    update public.client_master_plans set resend_key_secret_id = null where id = p_plan;
    return;
  end if;
  if v_secret is not null and exists (select 1 from vault.secrets where id = v_secret) then
    perform vault.update_secret(v_secret, btrim(p_key));
  else
    v_secret := vault.create_secret(btrim(p_key), 'resend_key_' || p_plan::text, 'Resend key for one Command Suite account');
  end if;
  update public.client_master_plans set resend_key_secret_id = v_secret where id = p_plan;
end $$;

create or replace function public.get_account_resend_key(p_plan uuid)
returns text language sql stable security definer set search_path = public, vault as $$
  select ds.decrypted_secret from public.client_master_plans p
  join vault.decrypted_secrets ds on ds.id = p.resend_key_secret_id where p.id = p_plan;
$$;

revoke all on function public.set_account_resend_key(uuid, text) from public, anon, authenticated;
revoke all on function public.get_account_resend_key(uuid) from public, anon, authenticated;
grant execute on function public.set_account_resend_key(uuid, text) to service_role;
grant execute on function public.get_account_resend_key(uuid) to service_role;
