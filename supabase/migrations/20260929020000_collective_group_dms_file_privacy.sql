-- The LifeCharter Collective: group direct messages (co024) and tighter file
-- privacy (co028). Additive only — existing 1:1 threads keep working as-is.
--
-- Group DMs reuse the tables 1:1 DMs already have (cm_dm_threads.is_group /
-- title and the cm_dm_participants table). Everything that changes membership
-- goes through SECURITY DEFINER functions, as cm_start_dm() already does.
-- DMs are still never auto-moderated; members can report group messages the
-- same way as 1:1 ones (cm_reports_capture already checks participation).
--
-- Files: the "community" bucket used to let any Collective member read any
-- object whose path they knew. Now an object is readable only when the
-- requester can see something that uses it (a post/reply in a channel they can
-- view, a conversation they're in, an avatar, the library, branding…), checked
-- with the same helpers the feed uses (cm_can_view_space, cm_in_thread…).

-- ─── Group DMs: schema ─────────────────────────────────────────────────────

alter table public.cm_dm_participants add column if not exists joined_at timestamptz not null default now();
alter table public.cm_dm_participants add column if not exists added_by uuid references auth.users(id) on delete set null;

-- 'system' rows are the small "Amy added Beth" lines in a group; they never
-- notify and never count as unread. Members can only write 'message' rows.
alter table public.cm_dm_messages add column if not exists kind text not null default 'message';
alter table public.cm_dm_messages drop constraint if exists cm_dm_messages_kind_check;
alter table public.cm_dm_messages add constraint cm_dm_messages_kind_check check (kind in ('message', 'system'));

alter table public.cm_dm_threads drop constraint if exists cm_dm_threads_title_check;
alter table public.cm_dm_threads add constraint cm_dm_threads_title_check check (title is null or char_length(title) <= 80);

-- 1:1 threads keep the block check on sending. In a group, a block between two
-- members doesn't silence the whole conversation: the blocker simply doesn't
-- see or get notified about the other person's messages.
drop policy if exists cm_dm_messages_insert on public.cm_dm_messages;
create policy cm_dm_messages_insert on public.cm_dm_messages for insert to authenticated
  with check (sender_id = auth.uid() and kind = 'message' and cm_in_thread(thread_id) and cm_in_collective()
              and (exists (select 1 from cm_dm_threads t where t.id = cm_dm_messages.thread_id and t.is_group)
                   or not exists (select 1 from cm_dm_participants p
                                  where p.thread_id = cm_dm_messages.thread_id and p.user_id <> auth.uid()
                                    and cm_blocked_between(auth.uid(), p.user_id))));
drop policy if exists cm_dm_messages_update on public.cm_dm_messages;
create policy cm_dm_messages_update on public.cm_dm_messages for update to authenticated
  using (sender_id = auth.uid() and kind = 'message') with check (sender_id = auth.uid() and kind = 'message');

-- ─── Group DMs: functions ──────────────────────────────────────────────────

-- Can the caller bring p_member into a conversation? Raises a friendly error.
create or replace function public.cm_dm_check_addable(p_member uuid)
returns text language plpgsql stable security definer set search_path = public as $$
declare v_name text; v_allow boolean;
begin
  select display_name, allow_dms into v_name, v_allow from cm_profiles where user_id = p_member and status = 'active';
  if v_name is null then raise exception 'One of those members isn''t available.'; end if;
  if cm_blocked_between(auth.uid(), p_member) then raise exception '% can''t be added to this conversation.', v_name; end if;
  if not v_allow and not cm_is_admin() then raise exception '% has turned off direct messages.', v_name; end if;
  return v_name;
end $$;
revoke all on function public.cm_dm_check_addable(uuid) from public, anon, authenticated;

create or replace function public.cm_dm_names(p_ids uuid[])
returns text language sql stable security definer set search_path = public as $$
  select coalesce(string_agg(coalesce(p.display_name, 'a member'), ', ' order by p.display_name), '')
  from unnest(p_ids) x left join cm_profiles p on p.user_id = x;
$$;
revoke all on function public.cm_dm_names(uuid[]) from public, anon, authenticated;

-- Start a group conversation with two or more other members.
create or replace function public.cm_start_group_dm(p_members uuid[], p_title text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_thread uuid; v_ids uuid[]; v_id uuid; v_me text; v_title text;
begin
  if v_uid is null or not cm_in_collective() then raise exception 'not a member'; end if;
  select coalesce(array_agg(distinct x), '{}') into v_ids from unnest(coalesce(p_members, '{}')) x where x is not null and x <> v_uid;
  if coalesce(array_length(v_ids, 1), 0) < 2 then raise exception 'Pick at least two people for a group conversation.'; end if;
  if array_length(v_ids, 1) > 49 then raise exception 'A group conversation can have up to 50 people.'; end if;
  foreach v_id in array v_ids loop perform cm_dm_check_addable(v_id); end loop;
  v_title := nullif(left(trim(coalesce(p_title, '')), 80), '');
  select display_name into v_me from cm_profiles where user_id = v_uid;

  insert into cm_dm_threads (is_group, title, created_by) values (true, v_title, v_uid) returning id into v_thread;
  insert into cm_dm_participants (thread_id, user_id, added_by) values (v_thread, v_uid, v_uid);
  insert into cm_dm_participants (thread_id, user_id, added_by) select v_thread, x, v_uid from unnest(v_ids) x;
  insert into cm_dm_messages (thread_id, sender_id, body, kind)
  values (v_thread, v_uid, coalesce(v_me, 'A member') || ' started the conversation with ' || cm_dm_names(v_ids), 'system');
  insert into cm_notifications (user_id, kind, title, body, href, actor_id)
  select x, 'dm', coalesce(v_me, 'A member') || ' added you to a group conversation',
         coalesce(v_title, 'With ' || cm_dm_names(v_ids)), '/community/messages/' || v_thread, v_uid
  from unnest(v_ids) x;
  return v_thread;
end $$;
revoke all on function public.cm_start_group_dm(uuid[], text) from public, anon;
grant execute on function public.cm_start_group_dm(uuid[], text) to authenticated;

-- Any member of a group can add people.
create or replace function public.cm_add_dm_members(p_thread uuid, p_members uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_ids uuid[]; v_id uuid; v_me text; v_title text; v_count int;
begin
  if v_uid is null or not cm_in_collective() or not cm_in_thread(p_thread) then raise exception 'not allowed'; end if;
  select title into v_title from cm_dm_threads where id = p_thread and is_group;
  if not found then raise exception 'People can only be added to a group conversation.'; end if;
  select coalesce(array_agg(distinct x), '{}') into v_ids from unnest(coalesce(p_members, '{}')) x
   where x is not null and not exists (select 1 from cm_dm_participants where thread_id = p_thread and user_id = x);
  if coalesce(array_length(v_ids, 1), 0) = 0 then return; end if;
  select count(*) into v_count from cm_dm_participants where thread_id = p_thread;
  if v_count + array_length(v_ids, 1) > 50 then raise exception 'A group conversation can have up to 50 people.'; end if;
  foreach v_id in array v_ids loop perform cm_dm_check_addable(v_id); end loop;
  select display_name into v_me from cm_profiles where user_id = v_uid;

  insert into cm_dm_participants (thread_id, user_id, added_by) select p_thread, x, v_uid from unnest(v_ids) x;
  insert into cm_dm_messages (thread_id, sender_id, body, kind)
  values (p_thread, v_uid, coalesce(v_me, 'A member') || ' added ' || cm_dm_names(v_ids), 'system');
  insert into cm_notifications (user_id, kind, title, body, href, actor_id)
  select x, 'dm', coalesce(v_me, 'A member') || ' added you to a group conversation',
         coalesce(v_title, 'Open the conversation to say hello'), '/community/messages/' || p_thread, v_uid
  from unnest(v_ids) x;
end $$;
revoke all on function public.cm_add_dm_members(uuid, uuid[]) from public, anon;
grant execute on function public.cm_add_dm_members(uuid, uuid[]) to authenticated;

-- The person who started the group (or a Collective admin) can remove someone.
create or replace function public.cm_remove_dm_member(p_thread uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); t record; v_me text;
begin
  select * into t from cm_dm_threads where id = p_thread and is_group;
  if not found or v_uid is null or not cm_in_thread(p_thread) then raise exception 'not allowed'; end if;
  if p_user = v_uid then raise exception 'Use Leave to leave the conversation.'; end if;
  if t.created_by is distinct from v_uid and not cm_is_admin() then
    raise exception 'Only the person who started this conversation can remove people.';
  end if;
  delete from cm_dm_participants where thread_id = p_thread and user_id = p_user;
  if not found then return; end if;
  select display_name into v_me from cm_profiles where user_id = v_uid;
  insert into cm_dm_messages (thread_id, sender_id, body, kind)
  values (p_thread, v_uid, coalesce(v_me, 'A member') || ' removed ' || cm_dm_names(array[p_user]), 'system');
end $$;
revoke all on function public.cm_remove_dm_member(uuid, uuid) from public, anon;
grant execute on function public.cm_remove_dm_member(uuid, uuid) to authenticated;

-- Leave a group. If the starter leaves, the longest-standing member takes over.
create or replace function public.cm_leave_dm_group(p_thread uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); t record; v_me text; v_next uuid;
begin
  select * into t from cm_dm_threads where id = p_thread and is_group;
  if not found or v_uid is null or not cm_in_thread(p_thread) then raise exception 'not allowed'; end if;
  select display_name into v_me from cm_profiles where user_id = v_uid;
  delete from cm_dm_participants where thread_id = p_thread and user_id = v_uid;
  select user_id into v_next from cm_dm_participants where thread_id = p_thread order by joined_at, user_id limit 1;
  if v_next is null then return; end if; -- last one out: the thread just goes quiet
  if t.created_by is not distinct from v_uid then update cm_dm_threads set created_by = v_next where id = p_thread; end if;
  insert into cm_dm_messages (thread_id, sender_id, body, kind)
  values (p_thread, v_uid, coalesce(v_me, 'A member') || ' left the conversation', 'system');
end $$;
revoke all on function public.cm_leave_dm_group(uuid) from public, anon;
grant execute on function public.cm_leave_dm_group(uuid) to authenticated;

-- Any member can name (or un-name) a group.
create or replace function public.cm_rename_dm_group(p_thread uuid, p_title text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_title text; v_me text;
begin
  if v_uid is null or not cm_in_collective() or not cm_in_thread(p_thread)
     or not exists (select 1 from cm_dm_threads where id = p_thread and is_group) then
    raise exception 'not allowed';
  end if;
  v_title := nullif(left(trim(coalesce(p_title, '')), 80), '');
  update cm_dm_threads set title = v_title where id = p_thread and title is distinct from v_title;
  if not found then return; end if;
  select display_name into v_me from cm_profiles where user_id = v_uid;
  insert into cm_dm_messages (thread_id, sender_id, body, kind)
  values (p_thread, v_uid, coalesce(v_me, 'A member') ||
          case when v_title is null then ' removed the conversation name' else ' named the conversation “' || v_title || '”' end, 'system');
end $$;
revoke all on function public.cm_rename_dm_group(uuid, text) from public, anon;
grant execute on function public.cm_rename_dm_group(uuid, text) to authenticated;

-- Notifications: same as 1:1, plus the group name; never for system lines or
-- to someone who has a block with the sender.
create or replace function public.cm_notify_dm() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_actor text; t record;
begin
  if new.kind = 'system' then return null; end if;
  select display_name into v_actor from cm_profiles where user_id = new.sender_id;
  select is_group, title into t from cm_dm_threads where id = new.thread_id;
  insert into cm_notifications (user_id, kind, title, body, href, actor_id)
  select p.user_id, 'dm',
         case when t.is_group
              then coalesce(v_actor, 'A member') || ' in ' || coalesce(t.title, 'your group conversation')
              else 'New message from ' || coalesce(v_actor, 'a member') end,
         coalesce(nullif(left(new.body, 240), ''), '📷 Sent a photo'), '/community/messages/' || new.thread_id, new.sender_id
  from cm_dm_participants p
  where p.thread_id = new.thread_id and p.user_id <> new.sender_id and not p.muted
    and not cm_blocked_between(p.user_id, new.sender_id);
  return null;
end $$;
revoke all on function public.cm_notify_dm() from public, anon, authenticated;

create or replace function public.cm_unread_dm_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from cm_dm_messages m
  join cm_dm_participants p on p.thread_id = m.thread_id and p.user_id = auth.uid()
  where m.sender_id <> auth.uid() and m.created_at > p.last_read_at and m.deleted_at is null
    and m.kind = 'message' and not cm_i_blocked(m.sender_id);
$$;
grant execute on function public.cm_unread_dm_count() to authenticated;

-- ─── File privacy ──────────────────────────────────────────────────────────

create index if not exists cm_posts_attachments_idx on public.cm_posts using gin (attachments jsonb_path_ops);
create index if not exists cm_comments_attachments_idx on public.cm_comments using gin (attachments jsonb_path_ops);
create index if not exists cm_dm_messages_attachments_idx on public.cm_dm_messages using gin (attachments jsonb_path_ops);
create index if not exists cm_profiles_avatar_idx on public.cm_profiles (avatar_url) where avatar_url is not null;
create index if not exists cm_resources_storage_path_idx on public.cm_resources (storage_path) where storage_path is not null;

-- Can the signed-in person read this object in the "community" bucket?
-- Uploads always land in the uploader's own folder (<uid>/…), so a reference
-- only counts when it comes from that same person — nobody can "unlock"
-- someone else's private file by pasting its path into their own post.
create or replace function public.cm_can_read_file(p_path text)
returns boolean language sql stable security definer set search_path = public as $$
  with f as (
    select p_path as path, split_part(p_path, '/', 1) as folder,
           jsonb_build_array(jsonb_build_object('path', p_path)) as ref
  )
  select auth.uid() is not null and p_path is not null and p_path not like '%..%' and (
    cm_is_admin()
    or f.folder = auth.uid()::text                                  -- your own uploads
    or (cm_in_collective() and (
         -- channel covers / logos
         f.folder = 'spaces'
         -- profile photos
         or exists (select 1 from cm_profiles pr where pr.avatar_url = f.path and pr.user_id::text = f.folder)
         -- posts and replies in channels you can open (same rules as the feed)
         or exists (select 1 from cm_posts p
                    where p.attachments @> f.ref and p.author_id::text = f.folder
                      and cm_can_view_space(p.space_id)
                      and (p.deleted_at is null or p.author_id = auth.uid() or cm_can_moderate(p.space_id))
                      and not cm_i_blocked(p.author_id))
         or exists (select 1 from cm_comments c
                    where c.attachments @> f.ref and c.author_id::text = f.folder
                      and cm_can_view_space(c.space_id)
                      and (c.deleted_at is null or c.author_id = auth.uid() or cm_can_moderate(c.space_id))
                      and not cm_i_blocked(c.author_id))
         -- conversations you're in
         or exists (select 1 from cm_dm_messages m
                    where m.attachments @> f.ref and m.sender_id::text = f.folder
                      and m.deleted_at is null and cm_in_thread(m.thread_id))
         -- library files for channels you can open
         or exists (select 1 from cm_resources r
                    where r.storage_path = f.path and r.deleted_at is null
                      and (f.folder = 'library' or r.created_by::text = f.folder)
                      and ((r.space_id is null) or cm_can_view_space(r.space_id)))
         -- event covers and Explore cards (set by admins / channel moderators)
         or exists (select 1 from cm_events e
                    where e.cover_url = f.path and e.deleted_at is null and cm_can_view_event(e.space_ids)
                      and (e.created_by::text = f.folder or exists (select 1 from cm_admins a where a.user_id::text = f.folder)))
         or exists (select 1 from cm_discover_cards d
                    where d.image_url = f.path and exists (select 1 from cm_admins a where a.user_id::text = f.folder))
    ))
  ) from f;
$$;
revoke all on function public.cm_can_read_file(text) from public, anon;
grant execute on function public.cm_can_read_file(text) to authenticated;

-- Batch form for the signing endpoint: returns only the paths you may read.
create or replace function public.cm_readable_files(p_paths text[])
returns setof text language sql stable security invoker set search_path = public as $$
  select distinct x from unnest(coalesce(p_paths, '{}')) x where public.cm_can_read_file(x);
$$;
revoke all on function public.cm_readable_files(text[]) from public, anon;
grant execute on function public.cm_readable_files(text[]) to authenticated;

-- Direct object reads (including creating a signed URL with your own session)
-- now need the same access. Uploads/deletes are unchanged.
drop policy if exists "cm community read" on storage.objects;
create policy "cm community read" on storage.objects for select to authenticated
  using (bucket_id = 'community' and public.cm_can_read_file(name));
