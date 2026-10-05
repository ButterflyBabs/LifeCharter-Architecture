-- "Skip anyone with these tags": a broadcast leaves them out; a campaign stops sending to them.
alter table public.crm_broadcasts add column if not exists skip_tags text[] not null default '{}';
alter table public.sequences add column if not exists skip_tags text[] not null default '{}';
