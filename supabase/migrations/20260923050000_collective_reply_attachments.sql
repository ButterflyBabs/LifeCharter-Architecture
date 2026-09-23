-- Photos and videos in replies (posts and DMs already carry attachments).
alter table public.cm_comments add column if not exists attachments jsonb not null default '[]'::jsonb;

-- Photo-only messages and replies read "📷 …" in notifications instead of blank.
create or replace function public.cm_notify_dm() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_actor text;
begin
  select display_name into v_actor from cm_profiles where user_id = new.sender_id;
  insert into cm_notifications (user_id, kind, title, body, href, actor_id)
  select p.user_id, 'dm', 'New message from ' || coalesce(v_actor, 'a member'),
         coalesce(nullif(left(new.body, 240), ''), '📷 Sent a photo'), '/community/messages/' || new.thread_id, new.sender_id
  from cm_dm_participants p
  where p.thread_id = new.thread_id and p.user_id <> new.sender_id and not p.muted;
  return null;
end $$;

create or replace function public.cm_notify_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; v_actor text; v_parent_author uuid; v_body text;
begin
  select author_id, title, body into p from cm_posts where id = new.post_id;
  select display_name into v_actor from cm_profiles where user_id = new.author_id;
  v_body := coalesce(nullif(left(new.body, 240), ''), '📷 Shared a photo');
  if new.parent_id is not null then
    select author_id into v_parent_author from cm_comments where id = new.parent_id;
    if v_parent_author is not null and v_parent_author <> new.author_id then
      insert into cm_notifications (user_id, kind, title, body, href, actor_id, space_id)
      values (v_parent_author, 'reply', coalesce(v_actor, 'Someone') || ' replied to you',
              v_body, '/community/post/' || new.post_id, new.author_id, new.space_id);
    end if;
  end if;
  if p.author_id <> new.author_id and p.author_id is distinct from v_parent_author then
    insert into cm_notifications (user_id, kind, title, body, href, actor_id, space_id)
    values (p.author_id, 'comment', coalesce(v_actor, 'Someone') || ' commented on your post',
            v_body, '/community/post/' || new.post_id, new.author_id, new.space_id);
  end if;
  return null;
end $$;

revoke all on function public.cm_notify_dm() from public, anon, authenticated;
revoke all on function public.cm_notify_comment() from public, anon, authenticated;
