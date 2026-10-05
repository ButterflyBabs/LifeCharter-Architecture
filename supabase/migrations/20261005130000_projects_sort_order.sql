-- Lets a client drag their project cards into their own order on the Projects page.
alter table public.projects add column if not exists sort_order int not null default 0;
