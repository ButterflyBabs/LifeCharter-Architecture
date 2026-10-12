-- SOP checklists: a step can be ticked off while someone is running the process. The ticked step numbers live on the SOP
-- (one shared run state per SOP, cleared with "Start a fresh run"). Ticking is not an edit and never affects approval.
alter table sops add column if not exists checks jsonb not null default '[]'::jsonb;
alter table sops add column if not exists checks_at timestamptz;
