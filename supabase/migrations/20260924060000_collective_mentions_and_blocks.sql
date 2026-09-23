-- @mentions (stored as @[Name](user-id)) with notifications, and member blocking.

-- ─── Blocking ───────────────────────────────────────────────────────────────
create table if not exists public.cm_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.cm_blocks enable row level security;
create policy cm_blocks_own on public.cm_blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid() and cm_in_collective());

create or replace function public.cm_blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cm_blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;
create or replace function public.cm_i_blocked(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cm_blocks where blocker_id = auth.uid() and blocked_id = p_user);
$$;
revoke all on function public.cm_blocked_between(uuid, uuid) from public, anon;
revoke all on function public.cm_i_blocked(uuid) from public, anon;
grant execute on function public.cm_blocked_between(uuid, uuid) to authenticated;
grant execute on function public.cm_i_blocked(uuid) to authenticated;

drop policy if exists cm_posts_select on public.cm_posts;
create policy cm_posts_select on public.cm_posts for select to authenticated
  using (cm_can_view_space(space_id)
         and (deleted_at is null or author_id = auth.uid() or cm_can_moderate(space_id))
         and (cm_is_admin() or not cm_i_blocked(author_id)));
drop policy if exists cm_comments_select on public.cm_comments;
create policy cm_comments_select on public.cm_comments for select to authenticated
  using (cm_can_view_space(space_id) and (cm_is_admin() or not cm_i_blocked(author_id)));

drop policy if exists cm_dm_messages_insert on public.cm_dm_messages;
create policy cm_dm_messages_insert on public.cm_dm_messages for insert to authenticated
  with check (sender_id = auth.uid() and cm_in_thread(thread_id) and cm_in_collective()
              and not exists (select 1 from cm_dm_participants p
                              where p.thread_id = cm_dm_messages.thread_id and p.user_id <> auth.uid()
                                and cm_blocked_between(auth.uid(), p.user_id)));

create or replace function public.cm_start_dm(p_other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_thread uuid;
begin
  if v_uid is null or not cm_in_collective() then raise exception 'not a member'; end if;
  if p_other = v_uid then raise exception 'You can''t message yourself.'; end if;
  if not exists (select 1 from cm_profiles where user_id = p_other and status = 'active') then
    raise exception 'That member isn''t available.';
  end if;
  if cm_blocked_between(v_uid, p_other) then raise exception 'You can''t message this member.'; end if;
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

-- ─── Mentions ───────────────────────────────────────────────────────────────
create or replace function public.cm_plain(t text) returns text
language sql immutable set search_path = public as $$
  select regexp_replace(coalesce(t, ''), '@\[([^\]]{1,80})\]\([0-9a-fA-F-]{36}\)', '@\1', 'g');
$$;

create or replace function public.cm_notify_mentions(p_body text, p_author uuid, p_space uuid, p_href text, p_what text)
returns void language plpgsql security definer set search_path = public as $$
declare v_actor text; v_id uuid;
begin
  select display_name into v_actor from cm_profiles where user_id = p_author;
  for v_id in
    select distinct (m[1])::uuid from regexp_matches(coalesce(p_body, ''), '@\[[^\]]{1,80}\]\(([0-9a-fA-F-]{36})\)', 'g') as m
  loop
    continue when v_id = p_author;
    continue when not exists (select 1 from cm_profiles where user_id = v_id and status = 'active');
    continue when cm_blocked_between(v_id, p_author);
    continue when not (exists (select 1 from cm_space_members where space_id = p_space and user_id = v_id)
                       or exists (select 1 from cm_spaces where id = p_space and visibility = 'public' and not archived)
                       or exists (select 1 from cm_admins where user_id = v_id));
    insert into cm_notifications (user_id, kind, title, body, href, actor_id, space_id)
    values (v_id, 'mention', coalesce(v_actor, 'Someone') || ' mentioned you in a ' || p_what,
            left(trim(cm_plain(p_body)), 240), p_href, p_author, p_space);
  end loop;
end $$;
revoke all on function public.cm_notify_mentions(text, uuid, uuid, text, text) from public, anon, authenticated;

create or replace function public.cm_notify_post() returns trigger
language plpgsql security definer set search_path = public as $$
declare ch record;
begin
  perform cm_notify_mentions(coalesce(new.title, '') || ' ' || new.body, new.author_id, new.space_id, '/community/post/' || new.id, 'post');
  select kind, name into ch from cm_channels where id = new.channel_id;
  if ch.kind <> 'announcements' then return null; end if;
  insert into cm_notifications (user_id, kind, title, body, href, actor_id, space_id)
  select m.user_id, 'announcement',
         coalesce(nullif(new.title, ''), 'New in ' || ch.name),
         left(cm_plain(new.body), 240),
         '/community/post/' || new.id,
         new.author_id, new.space_id
  from cm_space_members m
  where m.space_id = new.space_id and m.user_id <> new.author_id and m.notify_level <> 'none'
    and not cm_blocked_between(m.user_id, new.author_id);
  return null;
end $$;

create or replace function public.cm_notify_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; v_actor text; v_parent_author uuid; v_body text;
begin
  perform cm_notify_mentions(new.body, new.author_id, new.space_id, '/community/post/' || new.post_id, 'reply');
  select author_id, title, body into p from cm_posts where id = new.post_id;
  select display_name into v_actor from cm_profiles where user_id = new.author_id;
  v_body := coalesce(nullif(left(cm_plain(new.body), 240), ''), '📷 Shared a photo');
  if new.parent_id is not null then
    select author_id into v_parent_author from cm_comments where id = new.parent_id;
    if v_parent_author is not null and v_parent_author <> new.author_id and not cm_blocked_between(v_parent_author, new.author_id) then
      insert into cm_notifications (user_id, kind, title, body, href, actor_id, space_id)
      values (v_parent_author, 'reply', coalesce(v_actor, 'Someone') || ' replied to you',
              v_body, '/community/post/' || new.post_id, new.author_id, new.space_id);
    end if;
  end if;
  if p.author_id <> new.author_id and p.author_id is distinct from v_parent_author and not cm_blocked_between(p.author_id, new.author_id) then
    insert into cm_notifications (user_id, kind, title, body, href, actor_id, space_id)
    values (p.author_id, 'comment', coalesce(v_actor, 'Someone') || ' commented on your post',
            v_body, '/community/post/' || new.post_id, new.author_id, new.space_id);
  end if;
  return null;
end $$;
revoke all on function public.cm_notify_post() from public, anon, authenticated;
revoke all on function public.cm_notify_comment() from public, anon, authenticated;
