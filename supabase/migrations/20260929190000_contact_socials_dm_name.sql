-- Contacts: social profiles (a link or @handle each).
alter table seq_contacts
  add column if not exists facebook text,
  add column if not exists linkedin text,
  add column if not exists instagram text,
  add column if not exists youtube text;
-- Each account can name its DM Pipeline (Babs's: "LCCS MasterClass DM Pipeline").
alter table client_master_plans add column if not exists dm_pipeline_name text;
update client_master_plans set dm_pipeline_name = 'LCCS MasterClass DM Pipeline' where id = 'acc142bf-68d5-4d44-97dc-f25b00a3cef1';
