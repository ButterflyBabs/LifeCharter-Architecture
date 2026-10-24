-- A group of broadcasts sent in weekly "sets": a person receives one set (once_set) from the group, then never another.
alter table crm_broadcasts add column if not exists once_group text, add column if not exists once_set text;
create index if not exists crm_broadcasts_once_group_idx on crm_broadcasts (once_group) where once_group is not null;
