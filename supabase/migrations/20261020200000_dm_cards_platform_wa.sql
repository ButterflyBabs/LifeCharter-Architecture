-- WhatsApp is a platform on Outreach Pipelines cards (added in the app 2026-10-14) but the table's check never listed it,
-- so a WhatsApp card could not be saved. Add it.
alter table dm_cards drop constraint if exists dm_cards_platform_check;
alter table dm_cards add constraint dm_cards_platform_check check (platform is null or platform in ('IG', 'FB', 'LI', 'WA', 'Email', 'TXT'));
