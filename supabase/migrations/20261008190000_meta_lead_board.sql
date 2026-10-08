-- Each account chooses which Outreach Pipeline its Meta lead-ad people land in (first stage). Babs's own account keeps
-- the MasterClass Pipeline's Registered stage plus Zoom registration.
alter table meta_lead_settings add column if not exists board_id uuid references pipeline_boards(id) on delete set null;
