-- A personal registration link per outreach card (lccommandsuite.com/m/<code>): counts the click and, when that
-- person registers through it, moves their card to Registered and ties the new contact to the card, even when
-- they register with a different email than the one on the card.
alter table dm_cards add column if not exists link_code text;
alter table dm_cards add column if not exists link_clicks integer not null default 0;
alter table dm_cards add column if not exists link_clicked_at timestamptz;
create unique index if not exists dm_cards_link_code on dm_cards (link_code) where link_code is not null;
