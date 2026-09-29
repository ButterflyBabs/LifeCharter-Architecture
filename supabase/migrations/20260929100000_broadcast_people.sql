-- Broadcasts can include people picked by hand, alongside (or instead of) tags.
alter table crm_broadcasts add column if not exists contact_ids uuid[] not null default '{}';
