-- Collective events: per-session replays (co018) and multi-day support (co019).
-- Additive only.

-- 1) Replays for individual sessions. One row per session, keyed by the
--    session's local date in the event's own time zone (the same YYYY-MM-DD
--    the app uses for recur_exdates). One-off events can use it too.
create table if not exists public.cm_event_replays (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.cm_events(id) on delete cascade,
  occurs_on date not null,
  url text,                 -- Vimeo / Zoom / YouTube / any link
  storage_path text,        -- or an uploaded file in the private 'community' bucket
  file_name text,
  file_size bigint,
  mime_type text,
  title text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cm_event_replays_has_media check (url is not null or storage_path is not null),
  constraint cm_event_replays_one_per_session unique (event_id, occurs_on)
);
create index if not exists cm_event_replays_event_idx on public.cm_event_replays (event_id, occurs_on desc);

alter table public.cm_event_replays enable row level security;

-- Members see a replay only when they can see its event.
drop policy if exists cm_event_replays_select on public.cm_event_replays;
create policy cm_event_replays_select on public.cm_event_replays for select to authenticated
  using (exists (select 1 from public.cm_events e
                 where e.id = event_id and e.deleted_at is null and public.cm_can_view_event(e.space_ids)));

-- Whoever can edit the event can add, change or remove its replays.
drop policy if exists cm_event_replays_insert on public.cm_event_replays;
create policy cm_event_replays_insert on public.cm_event_replays for insert to authenticated
  with check (exists (select 1 from public.cm_events e
                      where e.id = event_id and e.deleted_at is null and public.cm_can_manage_event(e.space_ids)));
drop policy if exists cm_event_replays_update on public.cm_event_replays;
create policy cm_event_replays_update on public.cm_event_replays for update to authenticated
  using (exists (select 1 from public.cm_events e where e.id = event_id and public.cm_can_manage_event(e.space_ids)))
  with check (exists (select 1 from public.cm_events e
                      where e.id = event_id and e.deleted_at is null and public.cm_can_manage_event(e.space_ids)));
drop policy if exists cm_event_replays_delete on public.cm_event_replays;
create policy cm_event_replays_delete on public.cm_event_replays for delete to authenticated
  using (exists (select 1 from public.cm_events e where e.id = event_id and public.cm_can_manage_event(e.space_ids)));

create or replace function public.cm_event_replays_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists cm_event_replays_touch on public.cm_event_replays;
create trigger cm_event_replays_touch before update on public.cm_event_replays
  for each row execute function public.cm_event_replays_touch();

grant select, insert, update, delete on public.cm_event_replays to authenticated;

-- 2) Multi-day events already store their range in starts_at / ends_at.
--    Index ends_at so "still running" multi-day events are found cheaply.
create index if not exists cm_events_ends_idx on public.cm_events (ends_at) where deleted_at is null;
