-- Babs's rule (2026-10-17): no Command Suite account is ever created without a payment AND the client's signature on the
-- Year-1 Operating Agreement. A New Client Onboarding form saved before both are in is kept here as 'awaiting' and the
-- two-minute job opens the account the moment both are in (the same behaviour as the self-serve Starter sign-up).
alter table client_intake_submissions
  add column if not exists account_status text not null default 'created',
  add column if not exists requested_by text,
  add column if not exists account_waiting_note text,
  add column if not exists account_created_at timestamptz;

create index if not exists client_intake_submissions_awaiting_idx on client_intake_submissions (created_at) where account_status = 'awaiting';
