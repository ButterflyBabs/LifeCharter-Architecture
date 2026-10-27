-- Call to Close consultant pipelines: a board can belong to one consultant (by sign-in email), and its cards carry the fields a consultant tracks.
alter table pipeline_boards add column if not exists owner_email text;
create index if not exists pipeline_boards_owner_idx on pipeline_boards (lower(owner_email)) where owner_email is not null;
alter table dm_cards
  add column if not exists business_name text,
  add column if not exists phone text,
  add column if not exists linkedin text,
  add column if not exists facebook text,
  add column if not exists instagram text,
  add column if not exists lead_tag text,
  add column if not exists discovery_at timestamptz,
  add column if not exists discovery_booking_id uuid,
  add column if not exists discovery_outcome text,
  add column if not exists followup_at timestamptz,
  add column if not exists closed_tier text,
  add column if not exists closed_on date,
  add column if not exists card_tags text[] not null default '{}';
alter table dm_cards drop constraint if exists dm_cards_discovery_outcome_check;
alter table dm_cards add constraint dm_cards_discovery_outcome_check check (discovery_outcome is null or discovery_outcome in ('attended','no_show'));
