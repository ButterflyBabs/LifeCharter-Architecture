-- "update": a note from the LifeCharter team about something new or fixed, shown to every client
-- on the Contact Support page under "What's new". Clients cannot post these; they are logged by the team.
alter table public.feedback_items drop constraint if exists feedback_items_kind_check;
alter table public.feedback_items add constraint feedback_items_kind_check check (kind in ('glitch', 'suggestion', 'feedback', 'update'));
