-- The LifeCharter Collective: channel covers + logos (co025) and search (co023).
--
-- Channels (cm_spaces) already carry logo_url / cover_url. They hold either an
-- https URL or a path in the private "community" bucket under
-- spaces/<space id>/…, so the public join page can safely sign exactly that
-- channel's own images for signed-out visitors (and nothing else).

-- ─── Branding ──────────────────────────────────────────────────────────────

alter table public.cm_spaces drop constraint if exists cm_spaces_logo_url_check;
alter table public.cm_spaces add constraint cm_spaces_logo_url_check
  check (logo_url is null or logo_url ~ '^https://' or logo_url like 'spaces/' || id::text || '/%');
alter table public.cm_spaces drop constraint if exists cm_spaces_cover_url_check;
alter table public.cm_spaces add constraint cm_spaces_cover_url_check
  check (cover_url is null or cover_url ~ '^https://' or cover_url like 'spaces/' || id::text || '/%');

-- Channel admins/moderators (and Collective admins) upload into spaces/<space id>/.
create or replace function public.cm_can_moderate_folder(p_folder text) returns boolean
language sql stable security definer set search_path = public as $$
  select cm_is_admin()
      or exists (select 1 from cm_space_members
                 where space_id::text = p_folder and user_id = auth.uid() and role in ('moderator', 'admin'));
$$;
revoke all on function public.cm_can_moderate_folder(text) from public, anon;
grant execute on function public.cm_can_moderate_folder(text) to authenticated;

drop policy if exists "cm community upload channel branding" on storage.objects;
create policy "cm community upload channel branding" on storage.objects for insert to authenticated
  with check (bucket_id = 'community' and (storage.foldername(name))[1] = 'spaces'
              and public.cm_can_moderate_folder((storage.foldername(name))[2]));
drop policy if exists "cm community delete channel branding" on storage.objects;
create policy "cm community delete channel branding" on storage.objects for delete to authenticated
  using (bucket_id = 'community' and (storage.foldername(name))[1] = 'spaces'
         and public.cm_can_moderate_folder((storage.foldername(name))[2]));

-- The join preview now includes the cover (return type changes, so recreate).
drop function if exists public.cm_join_preview(text);
create function public.cm_join_preview(p_slug text)
returns table (id uuid, slug text, name text, tagline text, description text, emoji text, logo_url text, cover_url text, visibility text, join_enabled boolean)
language sql stable security definer set search_path = public as $$
  select s.id, s.slug, s.name, s.tagline, s.description, s.emoji, s.logo_url, s.cover_url, s.visibility, s.join_enabled
  from cm_spaces s where s.slug = lower(p_slug) and not s.archived;
$$;
revoke all on function public.cm_join_preview(text) from public;
grant execute on function public.cm_join_preview(text) to anon, authenticated;

-- ─── Search ────────────────────────────────────────────────────────────────

create index if not exists cm_posts_fts_idx on public.cm_posts
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || body));
create index if not exists cm_comments_fts_idx on public.cm_comments
  using gin (to_tsvector('english', body));

-- SECURITY INVOKER on purpose: it runs as the signed-in member, so the same
-- RLS the feed uses (cm_posts_select / cm_comments_select / cm_spaces_select /
-- cm_channels_select — private channels, membership, blocks, suspension)
-- decides what can match. cm_can_view_space() is repeated as a second guard.
create or replace function public.cm_search(p_q text, p_limit int default 30)
returns table (
  kind text, id uuid, post_id uuid, post_title text, body text,
  space_id uuid, space_slug text, space_name text, space_emoji text, space_logo text,
  channel_slug text, channel_name text, author_id uuid, created_at timestamptz, rank real
)
language sql stable security invoker set search_path = public as $$
  with q as (
    select trim(coalesce(p_q, '')) as raw,
           websearch_to_tsquery('english', trim(coalesce(p_q, ''))) as ts,
           '%' || replace(replace(replace(trim(coalesce(p_q, '')), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pat
  )
  select * from (
    select 'post'::text, p.id, p.id, p.title, cm_plain(p.body),
           s.id, s.slug, s.name, s.emoji, s.logo_url, c.slug, c.name, p.author_id, p.created_at,
           (ts_rank(to_tsvector('english', coalesce(p.title, '') || ' ' || p.body), q.ts)
             + case when p.title ilike q.pat then 0.5::real else 0::real end)::real
    from q, cm_posts p
    join cm_channels c on c.id = p.channel_id
    join cm_spaces s on s.id = p.space_id
    where length(q.raw) >= 2
      and p.deleted_at is null and not c.archived and not s.archived
      and cm_can_view_space(p.space_id)
      and (to_tsvector('english', coalesce(p.title, '') || ' ' || p.body) @@ q.ts
           or p.title ilike q.pat or cm_plain(p.body) ilike q.pat)
    union all
    select 'reply'::text, cm.id, p.id, p.title, cm_plain(cm.body),
           s.id, s.slug, s.name, s.emoji, s.logo_url, c.slug, c.name, cm.author_id, cm.created_at,
           (ts_rank(to_tsvector('english', cm.body), q.ts) * 0.9)::real
    from q, cm_comments cm
    join cm_posts p on p.id = cm.post_id
    join cm_channels c on c.id = p.channel_id
    join cm_spaces s on s.id = p.space_id
    where length(q.raw) >= 2
      and cm.deleted_at is null and p.deleted_at is null and not c.archived and not s.archived
      and cm_can_view_space(cm.space_id) and cm_can_view_space(p.space_id)
      and (to_tsvector('english', cm.body) @@ q.ts or cm_plain(cm.body) ilike q.pat)
  ) r (kind, id, post_id, post_title, body, space_id, space_slug, space_name, space_emoji, space_logo, channel_slug, channel_name, author_id, created_at, rank)
  order by r.rank desc, r.created_at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 50);
$$;
revoke all on function public.cm_search(text, int) from public, anon;
grant execute on function public.cm_search(text, int) to authenticated;
