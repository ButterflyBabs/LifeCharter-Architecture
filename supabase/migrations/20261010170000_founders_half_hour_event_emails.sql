-- Founder's Half Hour joins the event email engine: allow its key and add three DRAFT (inactive) templates.
alter table public.event_email_templates drop constraint if exists event_email_templates_event_key_check;
alter table public.event_email_templates add constraint event_email_templates_event_key_check check (event_key = any (array['masterclass','incubator','founders-half-hour']));
-- (the three draft templates were inserted by hand on 2026-10-10 and are edited on Campaigns & Broadcasts > Event emails)
