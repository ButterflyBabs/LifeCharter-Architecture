-- Small admin-editable settings for the Collective.
create table if not exists public.cm_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.cm_settings enable row level security;
create policy cm_settings_admin on public.cm_settings for all to authenticated
  using (cm_is_admin()) with check (cm_is_admin());

insert into public.cm_settings (key, value) values ('welcome_dm', jsonb_build_object(
  'enabled', true,
  'body', E'Hi {first_name}, welcome to The LifeCharter Collective! 🦋\n\nI''m so glad you''re here. This is a place to create balance, build alignment and take command — together, with people who understand what that takes.\n\nThree small steps to settle in:\n• Say hello in Introduce Yourself — where you are and what you''re creating\n• Read our Community Guidelines — how we show up for each other\n• Put the Collective on your phone (Me → "Put the Collective on your phone") and turn on notifications\n\nThis message is just between us, so reply anytime with a question or to tell me what brought you here. I read every one.\n\nWith you on the path,\nAmiLynne (Babs)'
)) on conflict (key) do nothing;

-- When someone joins the Collective (their profile is created), open a DM
-- from the founding super admin and drop the welcome message in it.
create or replace function public.cm_send_welcome_dm() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_admin uuid;
  v_cfg jsonb;
  v_thread uuid;
  v_first text;
begin
  if exists (select 1 from cm_admins where user_id = new.user_id) then return null; end if;
  select value into v_cfg from cm_settings where key = 'welcome_dm';
  if v_cfg is null or coalesce((v_cfg->>'enabled')::boolean, false) = false or coalesce(v_cfg->>'body', '') = '' then return null; end if;
  select user_id into v_admin from cm_admins order by created_at limit 1;
  if v_admin is null then return null; end if;

  v_first := coalesce(nullif(split_part(trim(new.display_name), ' ', 1), ''), 'friend');
  insert into cm_dm_threads (created_by) values (v_admin) returning id into v_thread;
  insert into cm_dm_participants (thread_id, user_id) values (v_thread, v_admin), (v_thread, new.user_id);
  insert into cm_dm_messages (thread_id, sender_id, body)
  values (v_thread, v_admin, replace(v_cfg->>'body', '{first_name}', v_first));
  return null;
exception when others then
  -- Never let a welcome message block someone from joining.
  raise warning 'cm_send_welcome_dm failed: %', sqlerrm;
  return null;
end $$;
revoke all on function public.cm_send_welcome_dm() from public, anon, authenticated;

drop trigger if exists cm_send_welcome_dm on public.cm_profiles;
create trigger cm_send_welcome_dm after insert on public.cm_profiles
  for each row execute function public.cm_send_welcome_dm();
