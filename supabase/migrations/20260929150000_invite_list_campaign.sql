-- Each invite list can name the campaign that sends its invite (any name, any account).
alter table crm_invite_lists add column if not exists invite_sequence_id uuid references sequences(id) on delete set null;
update crm_invite_lists l set invite_sequence_id = s.id from sequences s where s.master_plan_id = l.master_plan_id and s.key = l.invite_tag and l.invite_sequence_id is null;
