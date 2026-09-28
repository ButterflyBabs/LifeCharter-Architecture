-- co036 — member AI features for The LifeCharter Collective:
-- voice journaling, "What you missed", thread "Catch me up", "Help me say this",
-- event recaps (host) and personal focus notes (Plus).
-- Additive only.

-- ─── "What you missed": remember the start of each member's previous visit ──
alter table public.cm_profiles add column if not exists previous_visit_at timestamptz;

-- Called when a member opens Collective Home. A new visit starts after 2 hours
-- away; returns when their previous visit started (at most 14 days back,
-- 7 days for a first visit), so Home can show what's new since then.
create or replace function public.cm_touch_visit() returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_last timestamptz;
  v_prev timestamptz;
begin
  if v_uid is null then return null; end if;
  select last_seen_at, previous_visit_at into v_last, v_prev from cm_profiles where user_id = v_uid for update;
  if not found then return null; end if;
  if v_last is null or now() - v_last > interval '2 hours' then
    v_prev := v_last;
    update cm_profiles set previous_visit_at = v_last, last_seen_at = now() where user_id = v_uid;
  else
    update cm_profiles set last_seen_at = now() where user_id = v_uid;
  end if;
  return greatest(coalesce(v_prev, now() - interval '7 days'), now() - interval '14 days');
end $$;
revoke all on function public.cm_touch_visit() from public, anon;
grant execute on function public.cm_touch_visit() to authenticated;

-- ─── AI usage: event recaps written by a host run on LifeCharter's key ───────
alter table public.cm_ai_usage drop constraint if exists cm_ai_usage_source_check;
alter table public.cm_ai_usage add constraint cm_ai_usage_source_check check (source in ('own', 'plus', 'house'));

-- ─── Event recaps: the recap post a host published for one session ──────────
create table if not exists public.cm_event_recaps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.cm_events(id) on delete cascade,
  occurrence_date text not null check (occurrence_date ~ '^\d{4}-\d{2}-\d{2}$'),
  post_id uuid not null references public.cm_posts(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (event_id, occurrence_date)
);
alter table public.cm_event_recaps enable row level security;
drop policy if exists cm_event_recaps_select on public.cm_event_recaps;
create policy cm_event_recaps_select on public.cm_event_recaps for select to authenticated
  using (exists (select 1 from cm_events e where e.id = event_id and e.deleted_at is null and cm_can_view_event(e.space_ids)));
drop policy if exists cm_event_recaps_manage on public.cm_event_recaps;
create policy cm_event_recaps_manage on public.cm_event_recaps for all to authenticated
  using (exists (select 1 from cm_events e where e.id = event_id and cm_can_manage_event(e.space_ids)))
  with check (exists (select 1 from cm_events e where e.id = event_id and cm_can_manage_event(e.space_ids)));
grant select, insert, update, delete on public.cm_event_recaps to authenticated;

-- ─── Focus notes: a member's private takeaway from a session (Plus) ─────────
create table if not exists public.cm_event_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_id uuid not null references public.cm_events(id) on delete cascade,
  occurrence_date text not null check (occurrence_date ~ '^\d{4}-\d{2}-\d{2}$'),
  takeaway text not null,
  next_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id, occurrence_date)
);
alter table public.cm_event_notes enable row level security;
drop policy if exists cm_event_notes_owner on public.cm_event_notes;
create policy cm_event_notes_owner on public.cm_event_notes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.cm_event_notes to authenticated;
