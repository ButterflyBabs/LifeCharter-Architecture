-- Which template a SOP was copied from (one copy of each per account). The 50 templates themselves live in
-- src/content/sopTemplates.json and are copied into each client account as editable drafts.
alter table sops add column if not exists template_key text;
create unique index if not exists sops_plan_template_key on sops (master_plan_id, template_key) where template_key is not null;
