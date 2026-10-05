-- false = someone else is doing this task for the owner (a build task, for example), so it stays
-- out of the owner's daily "What I need from you today" email. Everything defaults to the owner's.
alter table public.tasks add column if not exists owner_action boolean not null default true;
