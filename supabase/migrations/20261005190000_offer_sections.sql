-- Campaigns and broadcasts can be filed under an offer (e.g. "LCMC · LifeCharter MasterClass"),
-- which becomes the section header they sit under in Campaigns & Broadcasts.
alter table public.sequences add column if not exists offer text;
alter table public.crm_broadcasts add column if not exists offer text;
