-- Prospect Qualifier: keep the email that came with an uploaded list, so a person already on a pipeline can be
-- recognised by email as well as by profile link or name.
alter table icp_qualifications add column if not exists email text;
