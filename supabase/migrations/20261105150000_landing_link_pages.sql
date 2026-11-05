-- Link pages (a Beacons-style page of buttons for a bio link): a fifth Landing Pages template, and a label on each
-- tap so every button is counted on its own. Additive only.
alter table public.landing_pages drop constraint if exists landing_pages_template_check;
alter table public.landing_pages add constraint landing_pages_template_check check (template in ('optin','webinar','sales','booking','links'));
alter table public.landing_page_hits add column if not exists label text;
create index if not exists landing_page_hits_label_idx on public.landing_page_hits (page_id, label) where label is not null;
