-- The LifeCharter Collective — automatic channel access on purchase (co022, bw053)
-- and the admin engagement dashboard (co027). Additive only.
--
-- cm_purchase_access maps something Stripe tells us about a purchase to one or
-- more channels (cm_spaces). match_key is one of:
--   price_…   a Stripe Price id (matched against the checkout's line items)
--   prod_…    a Stripe Product id
--   plink_…   a Stripe Payment Link id
--   any other text: matched against the Checkout Session / Payment Link
--   metadata key "collective_access" (comma-separated values allowed)
-- The Stripe webhook records one cm_purchase_grants row per purchase per
-- channel (unique on stripe_ref + space_id, so Stripe retries are no-ops),
-- applies it at once when the buyer already has an account, and otherwise
-- keeps it pending until that email joins or signs in to the Collective.

create table if not exists public.cm_purchase_access (
  id uuid primary key default gen_random_uuid(),
  match_key text not null unique check (length(trim(match_key)) > 0),
  label text,
  space_ids uuid[] not null default '{}',
  crm_tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cm_purchase_grants (
  id uuid primary key default gen_random_uuid(),
  stripe_ref text not null,                 -- subscription id, else checkout session / invoice id
  email text not null,
  buyer_name text,
  space_id uuid not null references public.cm_spaces(id) on delete cascade,
  access_id uuid references public.cm_purchase_access(id) on delete set null,
  claim_token text not null default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  status text not null default 'pending' check (status in ('pending', 'applied')),
  user_id uuid references auth.users(id) on delete set null,
  applied_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (stripe_ref, space_id)
);
create index if not exists cm_purchase_grants_pending_email_idx on public.cm_purchase_grants (lower(email)) where status = 'pending';
create index if not exists cm_purchase_grants_claim_idx on public.cm_purchase_grants (claim_token);

alter table public.cm_purchase_access enable row level security;
alter table public.cm_purchase_grants enable row level security;

drop policy if exists cm_purchase_access_admin on public.cm_purchase_access;
create policy cm_purchase_access_admin on public.cm_purchase_access
  for all to authenticated using (cm_is_admin()) with check (cm_is_admin());

drop policy if exists cm_purchase_grants_admin_read on public.cm_purchase_grants;
create policy cm_purchase_grants_admin_read on public.cm_purchase_grants
  for select to authenticated using (cm_is_admin());

grant select, insert, update, delete on public.cm_purchase_access to authenticated;
grant select on public.cm_purchase_grants to authenticated;

-- Memberships created by a purchase say so.
alter table public.cm_space_members drop constraint if exists cm_space_members_joined_via_check;
alter table public.cm_space_members add constraint cm_space_members_joined_via_check
  check (joined_via in ('code', 'default', 'public', 'admin', 'purchase'));

-- Server-only: the account id for an email, or null.
create or replace function public.cm_user_id_for_email(p_email text)
returns uuid language sql stable security definer set search_path = public as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) order by created_at limit 1;
$$;
revoke all on function public.cm_user_id_for_email(text) from public, anon, authenticated;
grant execute on function public.cm_user_id_for_email(text) to service_role;

-- Applies every pending purchase grant for this account's email. Assumes the
-- person already has a Collective profile. Returns how many were applied.
create or replace function public.cm_apply_purchase_grants(p_user uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_email text; v_n int := 0; g record;
begin
  select email into v_email from auth.users where id = p_user;
  if v_email is null then return 0; end if;
  for g in select id, space_id from cm_purchase_grants where status = 'pending' and lower(email) = lower(v_email) loop
    insert into cm_space_members (space_id, user_id, joined_via)
    values (g.space_id, p_user, 'purchase') on conflict do nothing;
    update cm_purchase_grants set status = 'applied', user_id = p_user, applied_at = now() where id = g.id;
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;
revoke all on function public.cm_apply_purchase_grants(uuid) from public, anon, authenticated;
grant execute on function public.cm_apply_purchase_grants(uuid) to service_role;

-- A new Collective profile picks up anything that email already bought.
create or replace function public.cm_profiles_apply_purchases()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform cm_apply_purchase_grants(new.user_id);
  return null;
exception when others then
  raise warning 'cm_profiles_apply_purchases failed: %', sqlerrm;
  return null;
end $$;
drop trigger if exists cm_profiles_apply_purchases on public.cm_profiles;
create trigger cm_profiles_apply_purchases after insert on public.cm_profiles
  for each row execute function cm_profiles_apply_purchases();

-- Signed-in person with pending purchases but no Collective profile yet (e.g.
-- a LifeCharter account made after they bought): make them a member and apply.
create or replace function public.cm_claim_purchase_access()
returns int language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_email text; v_name text;
begin
  if v_uid is null then return 0; end if;
  select email, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) into v_email, v_name from auth.users where id = v_uid;
  if not exists (select 1 from cm_purchase_grants where status = 'pending' and lower(email) = lower(v_email)) then return 0; end if;
  if exists (select 1 from cm_profiles where user_id = v_uid and status = 'suspended') then return 0; end if;
  perform cm_ensure_member(v_uid, v_name);
  return cm_apply_purchase_grants(v_uid) + 1;
end $$;
revoke all on function public.cm_claim_purchase_access() from public, anon;
grant execute on function public.cm_claim_purchase_access() to authenticated;

-- ─── Engagement dashboard (admins only; counts, never content) ─────────────
create or replace function public.cm_admin_engagement()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not cm_is_admin() then raise exception 'Admins only'; end if;
  with activity as (
    select author_id as user_id, created_at from cm_posts where deleted_at is null
    union all select author_id, created_at from cm_comments where deleted_at is null
    union all select user_id, created_at from cm_reactions
    union all select sender_id, created_at from cm_dm_messages where deleted_at is null
    union all select user_id, created_at from cm_event_rsvps
    union all select user_id, updated_at from cm_journal_entries
  ),
  weeks as (
    select generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') as wk
  )
  select jsonb_build_object(
    'generated_at', now(),
    'members_total', (select count(*) from cm_profiles where status = 'active'),
    'active_7d', (select count(distinct user_id) from activity where created_at >= now() - interval '7 days'),
    'active_30d', (select count(distinct user_id) from activity where created_at >= now() - interval '30 days'),
    'weekly', (
      select jsonb_agg(jsonb_build_object(
        'week', to_char(w.wk, 'YYYY-MM-DD'),
        'new_members', (select count(*) from cm_profiles p where p.created_at >= w.wk and p.created_at < w.wk + interval '1 week'),
        'posts', (select count(*) from cm_posts p where p.deleted_at is null and p.created_at >= w.wk and p.created_at < w.wk + interval '1 week'),
        'replies', (select count(*) from cm_comments c where c.deleted_at is null and c.created_at >= w.wk and c.created_at < w.wk + interval '1 week'),
        'dms', (select count(*) from cm_dm_messages m where m.deleted_at is null and m.created_at >= w.wk and m.created_at < w.wk + interval '1 week'),
        'active', (select count(distinct a.user_id) from activity a where a.created_at >= w.wk and a.created_at < w.wk + interval '1 week')
      ) order by w.wk) from weeks w
    ),
    'top_channels', (
      select coalesce(jsonb_agg(t order by t.score desc), '[]'::jsonb) from (
        select s.id, s.name, s.emoji,
          (select count(*) from cm_posts p where p.space_id = s.id and p.deleted_at is null and p.created_at >= now() - interval '30 days') as posts,
          (select count(*) from cm_comments c where c.space_id = s.id and c.deleted_at is null and c.created_at >= now() - interval '30 days') as replies,
          (select count(*) from cm_reactions r where r.space_id = s.id and r.created_at >= now() - interval '30 days') as reactions,
          (select count(*) from cm_space_members m where m.space_id = s.id) as members,
          (select count(*) from cm_posts p where p.space_id = s.id and p.deleted_at is null and p.created_at >= now() - interval '30 days')
          + (select count(*) from cm_comments c where c.space_id = s.id and c.deleted_at is null and c.created_at >= now() - interval '30 days')
          + (select count(*) from cm_reactions r where r.space_id = s.id and r.created_at >= now() - interval '30 days') as score
        from cm_spaces s where not s.archived
      ) t
    ),
    'events', (
      select coalesce(jsonb_agg(e order by e.starts_at desc), '[]'::jsonb) from (
        select ev.id, ev.title, ev.starts_at, ev.recurrence,
          (select count(*) from cm_event_rsvps r where r.event_id = ev.id and r.status = 'going') as going,
          (select count(*) from cm_event_rsvps r where r.event_id = ev.id and r.status = 'maybe') as maybe
        from cm_events ev where ev.deleted_at is null
        order by ev.starts_at desc limit 20
      ) e
    ),
    'dms_30d', (select count(*) from cm_dm_messages where deleted_at is null and created_at >= now() - interval '30 days'),
    'dm_threads_active_30d', (select count(distinct thread_id) from cm_dm_messages where deleted_at is null and created_at >= now() - interval '30 days'),
    'purchase_grants', jsonb_build_object(
      'pending', (select count(*) from cm_purchase_grants where status = 'pending'),
      'applied', (select count(*) from cm_purchase_grants where status = 'applied')
    )
  ) into v;
  return v;
end $$;
revoke all on function public.cm_admin_engagement() from public, anon;
grant execute on function public.cm_admin_engagement() to authenticated;

-- SOUL Sessions ($7 first month, then $17/month Payment Link on amilynnecarroll.com)
-- unlocks the SOUL Sessions channel. Matches Payment Link metadata
-- collective_access=soul-sessions; admins can add the price/plink id too.
insert into public.cm_purchase_access (match_key, label, space_ids, crm_tags)
select 'soul-sessions', 'SOUL Sessions', array[s.id], array['soul-sessions']
from public.cm_spaces s where s.slug = 'soul-sessions'
on conflict (match_key) do nothing;
