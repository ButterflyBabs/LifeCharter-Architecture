-- A campaign person can be marked registered by hand (e.g. they confirmed by email
-- rather than through the sign-up form). Form sign-ups are read from crm_submissions.
alter table sequence_enrollments add column if not exists registered_at timestamptz, add column if not exists registered_note text;
