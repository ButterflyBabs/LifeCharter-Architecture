-- 1) Announcements and What's Happening are ongoing, so they live in Community
--    (Start Here keeps only onboarding: Welcome and Introduce Yourself).
update public.cm_channels c set space_id = (select id from public.cm_spaces where slug = 'commons'),
  sort_order = case c.slug when 'announcements' then 4 else 6 end
where c.slug in ('announcements', 'whats-happening')
  and c.space_id = (select id from public.cm_spaces where slug = 'start-here');
update public.cm_posts set body = replace(replace(body,
  E'\n• Announcements — news, new programs and changes.\n• What''s Happening — sessions and events coming up.\n\nCOMMUNITY\n',
  E'\n\nCOMMUNITY\n• Announcements — news, new programs and changes.\n• What''s Happening — sessions and events coming up.\n'),
  E'right now.\n\n\nCOMMUNITY', E'right now.\n\nCOMMUNITY')
where title like 'Welcome — here%';

-- 2) Events can be shown to several channels (empty = the whole Collective).
alter table public.cm_events add column if not exists space_ids uuid[] not null default '{}';
update public.cm_events set space_ids = array[space_id] where space_id is not null and space_ids = '{}';
create index if not exists cm_events_space_ids_idx on public.cm_events using gin (space_ids);

create or replace function public.cm_can_view_event(p_ids uuid[]) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when coalesce(array_length(p_ids, 1), 0) = 0 then cm_in_collective()
    else cm_is_admin() or exists (select 1 from unnest(p_ids) x where cm_can_view_space(x))
  end;
$$;

-- Admins manage any event; a channel moderator manages an event only when
-- they moderate every channel it's shown to.
create or replace function public.cm_can_manage_event(p_ids uuid[]) returns boolean
language sql stable security definer set search_path = public as $$
  select cm_is_admin()
      or (coalesce(array_length(p_ids, 1), 0) > 0
          and not exists (select 1 from unnest(p_ids) x where not cm_can_moderate(x)));
$$;
revoke all on function public.cm_can_view_event(uuid[]) from public, anon;
revoke all on function public.cm_can_manage_event(uuid[]) from public, anon;
grant execute on function public.cm_can_view_event(uuid[]) to authenticated;
grant execute on function public.cm_can_manage_event(uuid[]) to authenticated;

drop policy if exists cm_events_select on public.cm_events;
drop policy if exists cm_events_manage on public.cm_events;
create policy cm_events_select on public.cm_events for select to authenticated
  using (deleted_at is null and cm_can_view_event(space_ids));
create policy cm_events_insert on public.cm_events for insert to authenticated
  with check (cm_can_manage_event(space_ids));
create policy cm_events_update on public.cm_events for update to authenticated
  using (cm_can_manage_event(space_ids)) with check (cm_can_manage_event(space_ids));
create policy cm_events_delete on public.cm_events for delete to authenticated
  using (cm_can_manage_event(space_ids));

-- RSVPs only for events the member can actually see.
drop policy if exists cm_event_rsvps_self on public.cm_event_rsvps;
create policy cm_event_rsvps_self on public.cm_event_rsvps for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from cm_events e where e.id = event_id and e.deleted_at is null and cm_can_view_event(e.space_ids)));
