-- The LifeCharter Collective — community schema.
--
-- LifeCharter is the community; programs are spaces inside it. A person joins
-- the Collective through a space's join link (/join/<slug>) with that space's
-- invite code. Every member is auto-added to the default spaces (Start Here +
-- The Commons); program spaces are private and need their own code.
--
-- Access is enforced here with RLS so the browser can talk to Supabase
-- directly with the signed-in user's session. Invite codes live in their own
-- admin-only table so they never leak through a space read, and phone numbers
-- live in a self-only table so the member directory can't expose them.
-- Everything that grants access (joining, starting a DM) goes through
-- SECURITY DEFINER functions that do their own checks.

-- ─── Core tables ───────────────────────────────────────────────────────────

create table if not exists public.cm_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.cm_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  headline text,
  bio text,
  avatar_url text,
  location text,
  website text,
  show_in_directory boolean not null default true,
  allow_dms boolean not null default true,
  notify_email boolean not null default true,
  notify_push boolean not null default true,
  status text not null default 'active' check (status in ('active', 'suspended')),
  onboarded boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cm_private_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  updated_at timestamptz not null default now()
);

create table if not exists public.cm_spaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  tagline text,
  description text,
  emoji text,
  logo_url text,
  cover_url text,
  section text not null default 'programs' check (section in ('start', 'community', 'programs', 'alumni')),
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  is_default boolean not null default false,       -- every Collective member is auto-added
  join_enabled boolean not null default true,      -- /join/<slug> accepts new sign-ups
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Admin-only: kept apart from cm_spaces so a space read can never expose it.
create table if not exists public.cm_space_codes (
  space_id uuid primary key references public.cm_spaces(id) on delete cascade,
  code text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.cm_space_members (
  space_id uuid not null references public.cm_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  joined_via text not null default 'code' check (joined_via in ('code', 'default', 'public', 'admin')),
  notify_level text not null default 'all' check (notify_level in ('all', 'announcements', 'none')),
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);
create index if not exists cm_space_members_user_idx on public.cm_space_members (user_id);

create table if not exists public.cm_channels (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.cm_spaces(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  emoji text,
  description text,
  kind text not null default 'discussion' check (kind in ('discussion', 'announcements')),
  post_policy text not null default 'members' check (post_policy in ('members', 'moderators')),
  prompt text,                                    -- placeholder/prompt shown in the composer
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (space_id, slug)
);

create table if not exists public.cm_posts (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.cm_spaces(id) on delete cascade,
  channel_id uuid not null references public.cm_channels(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  pinned boolean not null default false,
  comment_count int not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index if not exists cm_posts_channel_idx on public.cm_posts (channel_id, created_at desc);
create index if not exists cm_posts_space_idx on public.cm_posts (space_id, created_at desc);

create table if not exists public.cm_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.cm_posts(id) on delete cascade,
  space_id uuid not null references public.cm_spaces(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.cm_comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index if not exists cm_comments_post_idx on public.cm_comments (post_id, created_at);

create table if not exists public.cm_reactions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.cm_spaces(id) on delete cascade,
  post_id uuid references public.cm_posts(id) on delete cascade,
  comment_id uuid references public.cm_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  check ((post_id is null) <> (comment_id is null))
);
create unique index if not exists cm_reactions_post_uq on public.cm_reactions (post_id, user_id, emoji) where post_id is not null;
create unique index if not exists cm_reactions_comment_uq on public.cm_reactions (comment_id, user_id, emoji) where comment_id is not null;

-- ─── Direct messages ───────────────────────────────────────────────────────

create table if not exists public.cm_dm_threads (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_by uuid references auth.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.cm_dm_participants (
  thread_id uuid not null references public.cm_dm_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  muted boolean not null default false,
  primary key (thread_id, user_id)
);
create index if not exists cm_dm_participants_user_idx on public.cm_dm_participants (user_id);

create table if not exists public.cm_dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.cm_dm_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index if not exists cm_dm_messages_thread_idx on public.cm_dm_messages (thread_id, created_at);

-- ─── Events, library, discover, notifications, push ────────────────────────

create table if not exists public.cm_events (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references public.cm_spaces(id) on delete cascade, -- null = open to the whole Collective
  title text not null,
  description text,
  kind text not null default 'session' check (kind in ('anchor', 'session', 'workshop', 'masterclass', 'office_hours', 'challenge', 'summit', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'America/Denver',
  join_url text,
  location text,
  replay_url text,
  cover_url text,
  recurrence text,                                 -- display-only, e.g. "Every Tuesday"
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists cm_events_starts_idx on public.cm_events (starts_at);

create table if not exists public.cm_event_rsvps (
  event_id uuid not null references public.cm_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'maybe', 'not_going')),
  reminded_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.cm_resources (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references public.cm_spaces(id) on delete cascade, -- null = LifeCharter Library (everyone)
  category text not null default 'Guides',
  title text not null,
  description text,
  kind text not null default 'link' check (kind in ('file', 'link', 'video')),
  url text,
  storage_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  sort_order int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.cm_discover_cards (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references public.cm_spaces(id) on delete cascade, -- hidden from members already in this space
  title text not null,
  blurb text,
  teaser text,                                     -- a sample line from inside the program
  image_url text,
  cta_label text not null default 'Learn more',
  cta_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cm_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                              -- announcement | comment | reply | dm | mention | event
  title text not null,
  body text,
  href text,
  actor_id uuid references auth.users(id) on delete set null,
  space_id uuid references public.cm_spaces(id) on delete cascade,
  read_at timestamptz,
  emailed_at timestamptz,
  pushed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cm_notifications_user_idx on public.cm_notifications (user_id, created_at desc);
create index if not exists cm_notifications_outbox_idx on public.cm_notifications (created_at) where emailed_at is null or pushed_at is null;

create table if not exists public.cm_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ─── Access helpers (SECURITY DEFINER so policies don't recurse) ───────────

create or replace function public.cm_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cm_admins where user_id = auth.uid());
$$;

create or replace function public.cm_in_collective() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cm_profiles where user_id = auth.uid() and status = 'active')
      or exists (select 1 from cm_admins where user_id = auth.uid());
$$;

create or replace function public.cm_is_space_member(p_space uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cm_space_members where space_id = p_space and user_id = auth.uid());
$$;

create or replace function public.cm_can_view_space(p_space uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select cm_is_admin()
      or (cm_in_collective() and (
            exists (select 1 from cm_space_members where space_id = p_space and user_id = auth.uid())
         or exists (select 1 from cm_spaces where id = p_space and visibility = 'public' and not archived)));
$$;

create or replace function public.cm_can_moderate(p_space uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select cm_is_admin()
      or exists (select 1 from cm_space_members
                 where space_id = p_space and user_id = auth.uid() and role in ('moderator', 'admin'));
$$;

create or replace function public.cm_in_thread(p_thread uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cm_dm_participants where thread_id = p_thread and user_id = auth.uid());
$$;

-- ─── Integrity triggers ────────────────────────────────────────────────────

-- Posts: space always follows the channel; only moderators may pin; authors
-- can't be reassigned; posting in a moderators-only channel needs a moderator.
create or replace function public.cm_posts_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare ch record;
begin
  -- Updates from our own triggers (comment counts) bypass the guard.
  if tg_op = 'UPDATE' and pg_trigger_depth() > 1 then return new; end if;
  select space_id, post_policy into ch from cm_channels where id = new.channel_id;
  if ch is null then raise exception 'channel not found'; end if;
  new.space_id := ch.space_id;
  if tg_op = 'INSERT' then
    if auth.uid() is not null and not cm_can_moderate(new.space_id) then
      if new.pinned then new.pinned := false; end if;
      if ch.post_policy = 'moderators' then raise exception 'only moderators can post here'; end if;
    end if;
    new.comment_count := 0;
    new.last_activity_at := now();
  else
    new.author_id := old.author_id;
    new.comment_count := old.comment_count;
    if auth.uid() is not null and not cm_can_moderate(old.space_id) then
      new.pinned := old.pinned;
      new.channel_id := old.channel_id;
      new.space_id := old.space_id;
    end if;
    if new.body is distinct from old.body or new.title is distinct from old.title then
      new.edited_at := now();
    end if;
  end if;
  return new;
end $$;
drop trigger if exists cm_posts_guard on public.cm_posts;
create trigger cm_posts_guard before insert or update on public.cm_posts
  for each row execute function public.cm_posts_guard();

create or replace function public.cm_comments_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    select space_id into new.space_id from cm_posts where id = new.post_id and deleted_at is null;
    if new.space_id is null then raise exception 'post not found'; end if;
  else
    new.author_id := old.author_id;
    new.post_id := old.post_id;
    new.space_id := old.space_id;
    if new.body is distinct from old.body then new.edited_at := now(); end if;
  end if;
  return new;
end $$;
drop trigger if exists cm_comments_guard on public.cm_comments;
create trigger cm_comments_guard before insert or update on public.cm_comments
  for each row execute function public.cm_comments_guard();

create or replace function public.cm_comments_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update cm_posts set comment_count = comment_count + 1, last_activity_at = now() where id = new.post_id;
  elsif tg_op = 'UPDATE' and new.deleted_at is not null and old.deleted_at is null then
    update cm_posts set comment_count = greatest(comment_count - 1, 0) where id = new.post_id;
  end if;
  return null;
end $$;
drop trigger if exists cm_comments_count on public.cm_comments;
create trigger cm_comments_count after insert or update on public.cm_comments
  for each row execute function public.cm_comments_count();

create or replace function public.cm_reactions_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.post_id is not null then
    select space_id into new.space_id from cm_posts where id = new.post_id;
  else
    select space_id into new.space_id from cm_comments where id = new.comment_id;
  end if;
  return new;
end $$;
drop trigger if exists cm_reactions_guard on public.cm_reactions;
create trigger cm_reactions_guard before insert on public.cm_reactions
  for each row execute function public.cm_reactions_guard();

-- Members can edit their own profile but not their own status.
create or replace function public.cm_profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not cm_is_admin() then
    new.status := old.status;
    new.user_id := old.user_id;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists cm_profiles_guard on public.cm_profiles;
create trigger cm_profiles_guard before update on public.cm_profiles
  for each row execute function public.cm_profiles_guard();

-- Members may change their own notification level; only moderators change roles.
create or replace function public.cm_space_members_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not cm_can_moderate(old.space_id) then
    new.role := old.role;
  end if;
  -- Only super admins hand out the space-admin role.
  if auth.uid() is not null and new.role = 'admin' and old.role <> 'admin' and not cm_is_admin() then
    new.role := old.role;
  end if;
  new.space_id := old.space_id;
  new.user_id := old.user_id;
  return new;
end $$;
drop trigger if exists cm_space_members_guard on public.cm_space_members;
create trigger cm_space_members_guard before update on public.cm_space_members
  for each row execute function public.cm_space_members_guard();

create or replace function public.cm_dm_messages_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update cm_dm_threads set last_message_at = new.created_at where id = new.thread_id;
  update cm_dm_participants set last_read_at = new.created_at
    where thread_id = new.thread_id and user_id = new.sender_id;
  return null;
end $$;
drop trigger if exists cm_dm_messages_after on public.cm_dm_messages;
create trigger cm_dm_messages_after after insert on public.cm_dm_messages
  for each row execute function public.cm_dm_messages_after();

-- ─── RLS ───────────────────────────────────────────────────────────────────

alter table public.cm_admins enable row level security;
alter table public.cm_profiles enable row level security;
alter table public.cm_private_profiles enable row level security;
alter table public.cm_spaces enable row level security;
alter table public.cm_space_codes enable row level security;
alter table public.cm_space_members enable row level security;
alter table public.cm_channels enable row level security;
alter table public.cm_posts enable row level security;
alter table public.cm_comments enable row level security;
alter table public.cm_reactions enable row level security;
alter table public.cm_dm_threads enable row level security;
alter table public.cm_dm_participants enable row level security;
alter table public.cm_dm_messages enable row level security;
alter table public.cm_events enable row level security;
alter table public.cm_event_rsvps enable row level security;
alter table public.cm_resources enable row level security;
alter table public.cm_discover_cards enable row level security;
alter table public.cm_notifications enable row level security;
alter table public.cm_push_subscriptions enable row level security;

-- admins
create policy cm_admins_select on public.cm_admins for select to authenticated using (cm_in_collective());

-- profiles: visible to fellow members; editable by self; admins manage.
create policy cm_profiles_select on public.cm_profiles for select to authenticated
  using (user_id = auth.uid() or cm_in_collective());
create policy cm_profiles_update_self on public.cm_profiles for update to authenticated
  using (user_id = auth.uid() or cm_is_admin()) with check (user_id = auth.uid() or cm_is_admin());

create policy cm_private_profiles_self on public.cm_private_profiles for all to authenticated
  using (user_id = auth.uid() or cm_is_admin()) with check (user_id = auth.uid() or cm_is_admin());

-- spaces: members see theirs + public ones; admins see and manage all.
create policy cm_spaces_select on public.cm_spaces for select to authenticated
  using (cm_can_view_space(id));
create policy cm_spaces_admin on public.cm_spaces for all to authenticated
  using (cm_is_admin()) with check (cm_is_admin());
create policy cm_spaces_space_admin_update on public.cm_spaces for update to authenticated
  using (cm_can_moderate(id)) with check (cm_can_moderate(id));

create policy cm_space_codes_admin on public.cm_space_codes for all to authenticated
  using (cm_is_admin()) with check (cm_is_admin());

-- space members: fellow members of a space can see the roster.
create policy cm_space_members_select on public.cm_space_members for select to authenticated
  using (user_id = auth.uid() or cm_can_view_space(space_id));
create policy cm_space_members_update on public.cm_space_members for update to authenticated
  using (user_id = auth.uid() or cm_can_moderate(space_id)) with check (user_id = auth.uid() or cm_can_moderate(space_id));
create policy cm_space_members_leave on public.cm_space_members for delete to authenticated
  using (user_id = auth.uid() or cm_can_moderate(space_id));
create policy cm_space_members_admin_insert on public.cm_space_members for insert to authenticated
  with check (cm_can_moderate(space_id));

-- channels
create policy cm_channels_select on public.cm_channels for select to authenticated
  using (cm_can_view_space(space_id));
create policy cm_channels_manage on public.cm_channels for all to authenticated
  using (cm_can_moderate(space_id)) with check (cm_can_moderate(space_id));

-- posts
create policy cm_posts_select on public.cm_posts for select to authenticated
  using (cm_can_view_space(space_id) and (deleted_at is null or author_id = auth.uid() or cm_can_moderate(space_id)));
create policy cm_posts_insert on public.cm_posts for insert to authenticated
  with check (author_id = auth.uid() and (cm_is_space_member(space_id) or cm_can_moderate(space_id)));
create policy cm_posts_update on public.cm_posts for update to authenticated
  using (author_id = auth.uid() or cm_can_moderate(space_id))
  with check (author_id = auth.uid() or cm_can_moderate(space_id));

-- comments: anyone who can see a space can reply (public spaces invite participation).
create policy cm_comments_select on public.cm_comments for select to authenticated
  using (cm_can_view_space(space_id));
create policy cm_comments_insert on public.cm_comments for insert to authenticated
  with check (author_id = auth.uid() and cm_can_view_space(space_id));
create policy cm_comments_update on public.cm_comments for update to authenticated
  using (author_id = auth.uid() or cm_can_moderate(space_id))
  with check (author_id = auth.uid() or cm_can_moderate(space_id));

-- reactions
create policy cm_reactions_select on public.cm_reactions for select to authenticated
  using (cm_can_view_space(space_id));
create policy cm_reactions_insert on public.cm_reactions for insert to authenticated
  with check (user_id = auth.uid() and cm_can_view_space(space_id));
create policy cm_reactions_delete on public.cm_reactions for delete to authenticated
  using (user_id = auth.uid());

-- DMs: participants only. Threads are created through cm_start_dm().
create policy cm_dm_threads_select on public.cm_dm_threads for select to authenticated
  using (cm_in_thread(id));
create policy cm_dm_participants_select on public.cm_dm_participants for select to authenticated
  using (cm_in_thread(thread_id));
create policy cm_dm_participants_update_self on public.cm_dm_participants for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cm_dm_messages_select on public.cm_dm_messages for select to authenticated
  using (cm_in_thread(thread_id));
create policy cm_dm_messages_insert on public.cm_dm_messages for insert to authenticated
  with check (sender_id = auth.uid() and cm_in_thread(thread_id) and cm_in_collective());
create policy cm_dm_messages_update on public.cm_dm_messages for update to authenticated
  using (sender_id = auth.uid()) with check (sender_id = auth.uid());

-- events: Collective-wide (space null) or in a space you can see.
create policy cm_events_select on public.cm_events for select to authenticated
  using (deleted_at is null and ((space_id is null and cm_in_collective()) or (space_id is not null and cm_can_view_space(space_id))));
create policy cm_events_manage on public.cm_events for all to authenticated
  using (cm_is_admin() or (space_id is not null and cm_can_moderate(space_id)))
  with check (cm_is_admin() or (space_id is not null and cm_can_moderate(space_id)));
create policy cm_event_rsvps_select on public.cm_event_rsvps for select to authenticated
  using (user_id = auth.uid() or cm_in_collective());
create policy cm_event_rsvps_self on public.cm_event_rsvps for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and cm_in_collective());

-- library
create policy cm_resources_select on public.cm_resources for select to authenticated
  using (deleted_at is null and ((space_id is null and cm_in_collective()) or (space_id is not null and cm_can_view_space(space_id))));
create policy cm_resources_manage on public.cm_resources for all to authenticated
  using (cm_is_admin() or (space_id is not null and cm_can_moderate(space_id)))
  with check (cm_is_admin() or (space_id is not null and cm_can_moderate(space_id)));

-- discover cards
create policy cm_discover_select on public.cm_discover_cards for select to authenticated
  using (cm_in_collective() and (active or cm_is_admin()));
create policy cm_discover_manage on public.cm_discover_cards for all to authenticated
  using (cm_is_admin()) with check (cm_is_admin());

-- notifications + push subscriptions: self only (rows are created by triggers / server).
create policy cm_notifications_self on public.cm_notifications for select to authenticated
  using (user_id = auth.uid());
create policy cm_notifications_mark_read on public.cm_notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cm_push_self on public.cm_push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Functions the app calls ───────────────────────────────────────────────

-- Public preview for /join/<slug> — safe fields only, callable signed out.
create or replace function public.cm_join_preview(p_slug text)
returns table (id uuid, slug text, name text, tagline text, description text, emoji text, logo_url text, visibility text, join_enabled boolean)
language sql stable security definer set search_path = public as $$
  select s.id, s.slug, s.name, s.tagline, s.description, s.emoji, s.logo_url, s.visibility, s.join_enabled
  from cm_spaces s where s.slug = lower(p_slug) and not s.archived;
$$;

-- Add a user to the Collective: profile + default spaces. Idempotent.
create or replace function public.cm_ensure_member(p_user uuid, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into cm_profiles (user_id, display_name)
  values (p_user, coalesce(nullif(trim(p_name), ''), 'LifeCharter Member'))
  on conflict (user_id) do nothing;
  insert into cm_space_members (space_id, user_id, joined_via)
  select id, p_user, 'default' from cm_spaces where is_default and not archived
  on conflict do nothing;
end $$;
revoke all on function public.cm_ensure_member(uuid, text) from public, anon, authenticated;

-- A signed-in user joins a space with its invite code (the "Already a member"
-- path, and the second step of a brand-new sign-up). The code is optional
-- only when the user already belongs to the space or is a super admin.
create or replace function public.cm_join_with_code(p_slug text, p_code text, p_name text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare s record; v_code text; v_uid uuid := auth.uid(); v_name text;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into s from cm_spaces where slug = lower(p_slug) and not archived;
  if s is null then raise exception 'This community link is no longer active.'; end if;

  if exists (select 1 from cm_profiles where user_id = v_uid and status = 'suspended') then
    raise exception 'Your membership is paused. Please contact support.';
  end if;

  if not exists (select 1 from cm_space_members where space_id = s.id and user_id = v_uid) and not cm_is_admin() then
    if not s.join_enabled then raise exception 'This community is not accepting new members right now.'; end if;
    select code into v_code from cm_space_codes where space_id = s.id;
    if v_code is null or upper(trim(coalesce(p_code, ''))) <> upper(v_code) then
      raise exception 'That invite code doesn''t match. Please check it and try again.';
    end if;
  end if;

  select coalesce(p_name, raw_user_meta_data->>'full_name', split_part(email, '@', 1))
    into v_name from auth.users where id = v_uid;
  perform cm_ensure_member(v_uid, v_name);
  insert into cm_space_members (space_id, user_id, joined_via)
  values (s.id, v_uid, 'code') on conflict do nothing;
  return s.id;
end $$;
grant execute on function public.cm_join_with_code(text, text, text) to authenticated;

-- A Collective member joins a public space with one click.
create or replace function public.cm_join_public_space(p_space uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not cm_in_collective() then raise exception 'not a member'; end if;
  if not exists (select 1 from cm_spaces where id = p_space and visibility = 'public' and not archived) then
    raise exception 'That space needs an invite code.';
  end if;
  insert into cm_space_members (space_id, user_id, joined_via)
  values (p_space, auth.uid(), 'public') on conflict do nothing;
end $$;
grant execute on function public.cm_join_public_space(uuid) to authenticated;

-- Find or create a 1:1 DM thread with another member.
create or replace function public.cm_start_dm(p_other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_thread uuid;
begin
  if v_uid is null or not cm_in_collective() then raise exception 'not a member'; end if;
  if p_other = v_uid then raise exception 'You can''t message yourself.'; end if;
  if not exists (select 1 from cm_profiles where user_id = p_other and status = 'active') then
    raise exception 'That member isn''t available.';
  end if;
  select t.id into v_thread from cm_dm_threads t
   where not t.is_group
     and exists (select 1 from cm_dm_participants where thread_id = t.id and user_id = v_uid)
     and exists (select 1 from cm_dm_participants where thread_id = t.id and user_id = p_other)
   limit 1;
  if v_thread is not null then return v_thread; end if;
  if not cm_is_admin() and not exists (select 1 from cm_profiles where user_id = p_other and allow_dms) then
    raise exception 'This member has turned off direct messages.';
  end if;
  insert into cm_dm_threads (created_by) values (v_uid) returning id into v_thread;
  insert into cm_dm_participants (thread_id, user_id) values (v_thread, v_uid), (v_thread, p_other);
  return v_thread;
end $$;
grant execute on function public.cm_start_dm(uuid) to authenticated;

-- Unread DM count for the nav badge.
create or replace function public.cm_unread_dm_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from cm_dm_messages m
  join cm_dm_participants p on p.thread_id = m.thread_id and p.user_id = auth.uid()
  where m.sender_id <> auth.uid() and m.created_at > p.last_read_at and m.deleted_at is null;
$$;
grant execute on function public.cm_unread_dm_count() to authenticated;

-- ─── In-app notifications (email/push delivery reads this as its outbox) ───

create or replace function public.cm_notify_post() returns trigger
language plpgsql security definer set search_path = public as $$
declare ch record; sp record; v_author text;
begin
  select kind, name, slug into ch from cm_channels where id = new.channel_id;
  if ch.kind <> 'announcements' then return null; end if;
  select slug, name into sp from cm_spaces where id = new.space_id;
  select display_name into v_author from cm_profiles where user_id = new.author_id;
  insert into cm_notifications (user_id, kind, title, body, href, actor_id, space_id)
  select m.user_id, 'announcement',
         coalesce(nullif(new.title, ''), 'New in ' || ch.name),
         left(new.body, 240),
         '/community/post/' || new.id,
         new.author_id, new.space_id
  from cm_space_members m
  where m.space_id = new.space_id and m.user_id <> new.author_id and m.notify_level <> 'none';
  return null;
end $$;
drop trigger if exists cm_notify_post on public.cm_posts;
create trigger cm_notify_post after insert on public.cm_posts
  for each row execute function public.cm_notify_post();

create or replace function public.cm_notify_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; v_actor text; v_parent_author uuid;
begin
  select author_id, title, body into p from cm_posts where id = new.post_id;
  select display_name into v_actor from cm_profiles where user_id = new.author_id;
  if new.parent_id is not null then
    select author_id into v_parent_author from cm_comments where id = new.parent_id;
    if v_parent_author is not null and v_parent_author <> new.author_id then
      insert into cm_notifications (user_id, kind, title, body, href, actor_id, space_id)
      values (v_parent_author, 'reply', coalesce(v_actor, 'Someone') || ' replied to you',
              left(new.body, 240), '/community/post/' || new.post_id, new.author_id, new.space_id);
    end if;
  end if;
  if p.author_id <> new.author_id and p.author_id is distinct from v_parent_author then
    insert into cm_notifications (user_id, kind, title, body, href, actor_id, space_id)
    values (p.author_id, 'comment', coalesce(v_actor, 'Someone') || ' commented on your post',
            left(new.body, 240), '/community/post/' || new.post_id, new.author_id, new.space_id);
  end if;
  return null;
end $$;
drop trigger if exists cm_notify_comment on public.cm_comments;
create trigger cm_notify_comment after insert on public.cm_comments
  for each row execute function public.cm_notify_comment();

create or replace function public.cm_notify_dm() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_actor text;
begin
  select display_name into v_actor from cm_profiles where user_id = new.sender_id;
  insert into cm_notifications (user_id, kind, title, body, href, actor_id)
  select p.user_id, 'dm', 'New message from ' || coalesce(v_actor, 'a member'),
         left(new.body, 240), '/community/messages/' || new.thread_id, new.sender_id
  from cm_dm_participants p
  where p.thread_id = new.thread_id and p.user_id <> new.sender_id and not p.muted;
  return null;
end $$;
drop trigger if exists cm_notify_dm on public.cm_dm_messages;
create trigger cm_notify_dm after insert on public.cm_dm_messages
  for each row execute function public.cm_notify_dm();

-- ─── Realtime ──────────────────────────────────────────────────────────────

do $$ begin
  begin alter publication supabase_realtime add table public.cm_dm_messages; exception when others then null; end;
  begin alter publication supabase_realtime add table public.cm_posts; exception when others then null; end;
  begin alter publication supabase_realtime add table public.cm_comments; exception when others then null; end;
  begin alter publication supabase_realtime add table public.cm_notifications; exception when others then null; end;
end $$;
