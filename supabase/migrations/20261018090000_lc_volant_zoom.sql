-- LC Volant: record in the Suite and pick up Zoom cloud recordings.
-- Where each recording came from, and (for Zoom) which meeting recording it was, so it is never picked up twice.
alter table public.volant_recordings add column if not exists source text not null default 'upload';  -- upload | browser | zoom
alter table public.volant_recordings add column if not exists zoom_uuid text;
create unique index if not exists volant_recordings_zoom_uuid_idx on public.volant_recordings (master_plan_id, zoom_uuid) where zoom_uuid is not null;

-- Automatic pickup: on/off, and (optional) words a meeting's topic must contain, e.g. "coaching, session".
alter table public.volant_settings add column if not exists zoom_auto boolean not null default false;
alter table public.volant_settings add column if not exists zoom_match text;

-- A client's own Zoom connection (Zoom sign-in). The tokens live in Vault, encrypted; the row keeps only the
-- secret's id. The house account uses the Suite's own Zoom app instead and never needs a row here.
create table if not exists public.zoom_connections (
  master_plan_id uuid primary key,
  zoom_user_id text,
  zoom_email text,
  token_secret_id uuid,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.zoom_connections enable row level security;

create or replace function public.set_zoom_tokens(p_plan uuid, p_tokens text)
returns void language plpgsql security definer set search_path = public, vault as $$
declare v_secret uuid;
begin
  select token_secret_id into v_secret from public.zoom_connections where master_plan_id = p_plan;
  if coalesce(btrim(p_tokens), '') = '' then
    if v_secret is not null then delete from vault.secrets where id = v_secret; end if;
    delete from public.zoom_connections where master_plan_id = p_plan;
    return;
  end if;
  if v_secret is not null and exists (select 1 from vault.secrets where id = v_secret) then
    perform vault.update_secret(v_secret, p_tokens);
  else
    v_secret := vault.create_secret(p_tokens, 'zoom_tokens_' || p_plan::text || '_' || extract(epoch from now())::bigint, 'Zoom tokens for one Command Suite account');
    insert into public.zoom_connections (master_plan_id, token_secret_id) values (p_plan, v_secret)
      on conflict (master_plan_id) do update set token_secret_id = excluded.token_secret_id, updated_at = now();
  end if;
end $$;

create or replace function public.get_zoom_tokens(p_plan uuid)
returns text language sql stable security definer set search_path = public, vault as $$
  select ds.decrypted_secret from public.zoom_connections z
  join vault.decrypted_secrets ds on ds.id = z.token_secret_id where z.master_plan_id = p_plan;
$$;

revoke all on function public.set_zoom_tokens(uuid, text) from public, anon, authenticated;
revoke all on function public.get_zoom_tokens(uuid) from public, anon, authenticated;
grant execute on function public.set_zoom_tokens(uuid, text) to service_role;
grant execute on function public.get_zoom_tokens(uuid) to service_role;

-- The service's own words when a transcription fails (for support; the page shows the friendly message in error).
alter table public.volant_recordings add column if not exists error_detail text;
