-- The Alignment Journal: each member's private weekly intentions, wins and
-- reflections. Only the owner can ever read an entry. An entry can also be
-- shared as a Community post (headline + an optional note written for the
-- Collective) — the private journal text never leaves this table.
create table if not exists public.cm_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('intention', 'win', 'reflection')),
  week_start date not null,                 -- the Monday of the member's week
  headline text,                            -- the shareable one-liner
  private_note text,                        -- only ever seen by the member
  community_note text,                      -- written for the Collective when shared
  dimension text,                           -- optional life/business area, private
  rating smallint check (rating between 1 and 5), -- reflection: how aligned the week felt
  carry_forward text,                       -- reflection: what to carry into next week
  shared_post_id uuid references public.cm_posts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cm_journal_user_week_idx on public.cm_journal_entries (user_id, week_start desc);
create unique index if not exists cm_journal_one_intention on public.cm_journal_entries (user_id, week_start) where kind = 'intention';
create unique index if not exists cm_journal_one_reflection on public.cm_journal_entries (user_id, week_start) where kind = 'reflection';

alter table public.cm_journal_entries enable row level security;
create policy cm_journal_owner on public.cm_journal_entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and cm_in_collective());

-- Per-member journal preferences: reminders (on by default) and the last
-- share choice for each kind (wins shared, intentions private by default).
alter table public.cm_profiles
  add column if not exists journal_reminders boolean not null default true,
  add column if not exists journal_share_win boolean not null default true,
  add column if not exists journal_share_intention boolean not null default false;

-- The areas members can tag entries with; editable by admins.
insert into public.cm_settings (key, value) values ('journal_dimensions', jsonb_build_object('items', jsonb_build_array(
  'Purpose', 'Health & Energy', 'Relationships', 'Family', 'Finances', 'Business',
  'Career & Work', 'Growth & Learning', 'Spirit', 'Home & Environment', 'Joy & Play', 'Contribution'
))) on conflict (key) do nothing;
-- Members read the dimension list; only admins change settings.
create policy cm_settings_read_dimensions on public.cm_settings for select to authenticated
  using (key = 'journal_dimensions' and cm_in_collective());
