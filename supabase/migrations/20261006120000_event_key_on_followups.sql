-- The Incubator shares the MasterClass attendance / follow-up / replay tables; event_key says which event a row belongs to.
alter table masterclass_attendance add column if not exists event_key text not null default 'masterclass';
alter table masterclass_followups add column if not exists event_key text not null default 'masterclass';
alter table masterclass_replays add column if not exists event_key text not null default 'masterclass';
