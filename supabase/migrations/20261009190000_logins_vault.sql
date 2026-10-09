-- Logins & Passwords vault (Settings > Logins & Passwords). Each person keeps their own. The visible details (name, address,
-- username, type) live in vault_items; the password and notes are stored encrypted in Supabase Vault and are only decrypted by the
-- server, after the person re-enters their Suite password. Lists never contain secrets. Every reveal is written to vault_audit.
create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  url text,
  username text,
  category text not null default 'Other',
  secret_id uuid,
  last_revealed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vault_items_owner on public.vault_items (owner_user_id, lower(label));
alter table public.vault_items enable row level security;

create table if not exists public.vault_audit (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  item_id uuid,
  item_label text,
  action text not null,
  at timestamptz not null default now()
);
create index if not exists vault_audit_owner on public.vault_audit (owner_user_id, at desc);
alter table public.vault_audit enable row level security;

-- Create or update an item and its encrypted secret ({"password":"...","notes":"..."} as text). Returns the item id.
create or replace function public.vault_item_save(p_user uuid, p_id uuid, p_label text, p_url text, p_username text, p_category text, p_secret text)
returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_id uuid := p_id;
  v_secret uuid;
begin
  if v_id is not null then
    select secret_id into v_secret from public.vault_items where id = v_id and owner_user_id = p_user;
    if not found then raise exception 'not found'; end if;
    update public.vault_items set label = p_label, url = p_url, username = p_username, category = p_category, updated_at = now() where id = v_id;
    if p_secret is not null then
      if v_secret is not null and exists (select 1 from vault.secrets where id = v_secret) then
        perform vault.update_secret(v_secret, p_secret);
      else
        v_secret := vault.create_secret(p_secret, 'vault_item_' || v_id::text, 'Logins vault item');
        update public.vault_items set secret_id = v_secret where id = v_id;
      end if;
    end if;
  else
    insert into public.vault_items (owner_user_id, label, url, username, category) values (p_user, p_label, p_url, p_username, p_category) returning id into v_id;
    if p_secret is not null then
      v_secret := vault.create_secret(p_secret, 'vault_item_' || v_id::text, 'Logins vault item');
      update public.vault_items set secret_id = v_secret where id = v_id;
    end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.vault_item_reveal(p_user uuid, p_id uuid)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select ds.decrypted_secret
  from public.vault_items i
  join vault.decrypted_secrets ds on ds.id = i.secret_id
  where i.id = p_id and i.owner_user_id = p_user;
$$;

create or replace function public.vault_item_delete(p_user uuid, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare v_secret uuid;
begin
  select secret_id into v_secret from public.vault_items where id = p_id and owner_user_id = p_user;
  if not found then return; end if;
  if v_secret is not null then delete from vault.secrets where id = v_secret; end if;
  delete from public.vault_items where id = p_id and owner_user_id = p_user;
end;
$$;

revoke all on function public.vault_item_save(uuid, uuid, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.vault_item_reveal(uuid, uuid) from public, anon, authenticated;
revoke all on function public.vault_item_delete(uuid, uuid) from public, anon, authenticated;
grant execute on function public.vault_item_save(uuid, uuid, text, text, text, text, text) to service_role;
grant execute on function public.vault_item_reveal(uuid, uuid) to service_role;
grant execute on function public.vault_item_delete(uuid, uuid) to service_role;
