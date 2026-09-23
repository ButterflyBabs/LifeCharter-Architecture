-- Each Command Suite account connects its own AI key. Keys move out of the
-- plain-text profiles.openai_api_key column into Supabase Vault (encrypted at
-- rest); the profile only keeps the secret's id. Only the server (service
-- role) can read or write a key — never the browser.
alter table public.profiles add column if not exists openai_key_secret_id uuid;

create or replace function public.set_account_ai_key(p_user uuid, p_key text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret uuid;
begin
  select openai_key_secret_id into v_secret from public.profiles where id = p_user;
  if not found then
    raise exception 'no profile for %', p_user;
  end if;
  if coalesce(btrim(p_key), '') = '' then
    if v_secret is not null then
      delete from vault.secrets where id = v_secret;
    end if;
    update public.profiles set openai_key_secret_id = null, openai_api_key = null where id = p_user;
    return;
  end if;
  if v_secret is not null and exists (select 1 from vault.secrets where id = v_secret) then
    perform vault.update_secret(v_secret, btrim(p_key));
  else
    v_secret := vault.create_secret(btrim(p_key), 'ai_key_' || p_user::text, 'OpenAI key for one Command Suite account');
  end if;
  update public.profiles set openai_key_secret_id = v_secret, openai_api_key = null where id = p_user;
end;
$$;

create or replace function public.get_account_ai_key(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public, vault
as $$
  select ds.decrypted_secret
  from public.profiles p
  join vault.decrypted_secrets ds on ds.id = p.openai_key_secret_id
  where p.id = p_user;
$$;

revoke all on function public.set_account_ai_key(uuid, text) from public, anon, authenticated;
revoke all on function public.get_account_ai_key(uuid) from public, anon, authenticated;
grant execute on function public.set_account_ai_key(uuid, text) to service_role;
grant execute on function public.get_account_ai_key(uuid) to service_role;

-- Move any existing plain-text keys into Vault, then clear the plain text.
do $$
declare r record;
begin
  for r in select id, openai_api_key from public.profiles where coalesce(btrim(openai_api_key), '') <> '' loop
    perform public.set_account_ai_key(r.id, r.openai_api_key);
  end loop;
end $$;

comment on column public.profiles.openai_api_key is 'DEPRECATED — keys live in Vault (openai_key_secret_id). Always null.';
