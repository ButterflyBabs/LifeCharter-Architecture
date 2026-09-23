-- Safety for the App Store (Guideline 1.2) and the community itself:
--   • members report posts, comments, messages or profiles
--   • an automatic filter (OpenAI moderation, via cron) flags new posts and
--     comments, hiding only the clearly harmful ones until an admin reviews
--   • admins work a Reports queue: remove, pause the member, restore, dismiss

create table if not exists public.cm_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null, -- null = automatic filter
  target_type text not null check (target_type in ('post', 'comment', 'message', 'profile')),
  target_id uuid not null,
  target_user_id uuid references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  snapshot text,          -- what was reported, captured server-side at report time
  status text not null default 'open' check (status in ('open', 'removed', 'dismissed', 'restored')),
  auto_hidden boolean not null default false,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cm_reports_open_idx on public.cm_reports (status, created_at desc);
alter table public.cm_reports enable row level security;
create policy cm_reports_insert on public.cm_reports for insert to authenticated
  with check (reporter_id = auth.uid() and cm_in_collective());
create policy cm_reports_read on public.cm_reports for select to authenticated
  using (reporter_id = auth.uid() or cm_is_admin());

-- Fill in who and what was reported from the real row (never trust the client).
create or replace function public.cm_reports_capture()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.target_type = 'post' then
    select author_id, left(coalesce(title || E'\n', '') || coalesce(body, ''), 2000) into new.target_user_id, new.snapshot from cm_posts where id = new.target_id;
  elsif new.target_type = 'comment' then
    select author_id, left(body, 2000) into new.target_user_id, new.snapshot from cm_comments where id = new.target_id;
  elsif new.target_type = 'message' then
    -- Only a participant in the conversation can report a message.
    if new.reporter_id is not null and not exists (
      select 1 from cm_dm_messages m join cm_dm_participants p on p.thread_id = m.thread_id
      where m.id = new.target_id and p.user_id = new.reporter_id
    ) then
      raise exception 'not allowed';
    end if;
    select sender_id, left(body, 2000) into new.target_user_id, new.snapshot from cm_dm_messages where id = new.target_id;
  elsif new.target_type = 'profile' then
    select user_id, left(coalesce(display_name, '') || E'\n' || coalesce(headline, '') || E'\n' || coalesce(bio, ''), 2000) into new.target_user_id, new.snapshot from cm_profiles where user_id = new.target_id;
  end if;
  if new.target_user_id is null then raise exception 'nothing to report'; end if;
  return new;
end;
$$;
drop trigger if exists cm_reports_capture on public.cm_reports;
create trigger cm_reports_capture before insert on public.cm_reports for each row execute function public.cm_reports_capture();

-- Tell the admins.
create or replace function public.cm_reports_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into cm_notifications (user_id, kind, title, body, href)
  select a.user_id, 'report',
    case when new.reporter_id is null then 'Automatic filter flagged a ' || new.target_type else 'A ' || new.target_type || ' was reported' end,
    left(coalesce(new.reason, '') || coalesce(': ' || new.snapshot, ''), 180),
    '/community/admin?tab=reports'
  from cm_admins a;
  return new;
end;
$$;
drop trigger if exists cm_reports_notify on public.cm_reports;
create trigger cm_reports_notify after insert on public.cm_reports for each row execute function public.cm_reports_notify();

-- Automatic filter bookkeeping; an edit sends it back through the filter.
alter table public.cm_posts add column if not exists moderated_at timestamptz;
alter table public.cm_comments add column if not exists moderated_at timestamptz;
update public.cm_posts set moderated_at = now() where moderated_at is null;
update public.cm_comments set moderated_at = now() where moderated_at is null;

create or replace function public.cm_remoderate()
returns trigger language plpgsql as $$
begin
  if new.body is distinct from old.body or (tg_table_name = 'cm_posts' and new.title is distinct from old.title) then
    new.moderated_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists cm_posts_remoderate on public.cm_posts;
create trigger cm_posts_remoderate before update on public.cm_posts for each row execute function public.cm_remoderate();
drop trigger if exists cm_comments_remoderate on public.cm_comments;
create trigger cm_comments_remoderate before update on public.cm_comments for each row execute function public.cm_remoderate();

-- Admin actions on a report.
create or replace function public.cm_admin_resolve_report(p_report uuid, p_action text)
returns void language plpgsql security definer set search_path = public as $$
declare r cm_reports;
begin
  if not cm_is_admin() then raise exception 'not allowed'; end if;
  select * into r from cm_reports where id = p_report;
  if not found then raise exception 'not found'; end if;
  if p_action = 'remove' then
    if r.target_type = 'post' then update cm_posts set deleted_at = coalesce(deleted_at, now()) where id = r.target_id;
    elsif r.target_type = 'comment' then update cm_comments set deleted_at = coalesce(deleted_at, now()) where id = r.target_id;
    elsif r.target_type = 'message' then update cm_dm_messages set deleted_at = coalesce(deleted_at, now()) where id = r.target_id;
    end if;
    update cm_reports set status = 'removed', resolved_by = auth.uid(), resolved_at = now() where target_type = r.target_type and target_id = r.target_id and status = 'open';
  elsif p_action = 'restore' then
    if r.target_type = 'post' then update cm_posts set deleted_at = null where id = r.target_id;
    elsif r.target_type = 'comment' then update cm_comments set deleted_at = null where id = r.target_id;
    end if;
    update cm_reports set status = 'restored', resolved_by = auth.uid(), resolved_at = now() where id = p_report;
  elsif p_action = 'pause' then
    update cm_profiles set status = 'suspended' where user_id = r.target_user_id and user_id not in (select user_id from cm_admins);
    update cm_reports set status = 'removed', resolved_by = auth.uid(), resolved_at = now() where id = p_report and status = 'open';
  elsif p_action = 'dismiss' then
    update cm_reports set status = 'dismissed', resolved_by = auth.uid(), resolved_at = now() where id = p_report;
  else
    raise exception 'unknown action';
  end if;
end;
$$;
revoke all on function public.cm_admin_resolve_report(uuid, text) from public, anon;
grant execute on function public.cm_admin_resolve_report(uuid, text) to authenticated;
revoke all on function public.cm_reports_capture() from public, anon, authenticated;
revoke all on function public.cm_reports_notify() from public, anon, authenticated;
