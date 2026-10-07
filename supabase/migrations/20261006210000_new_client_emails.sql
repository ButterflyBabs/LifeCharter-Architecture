-- The "your account is ready" email for each new client Babs creates an account for: written, edited and
-- approved on the New Client Accounts page before anything is created or sent.
create table if not exists new_client_emails (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  contact_id uuid references seq_contacts(id) on delete set null,
  email text not null,
  name text,
  subject text not null,
  body text not null,
  one_to_one text,
  status text not null default 'draft' check (status in ('draft', 'approved', 'sent')),
  approved_at timestamptz,
  sent_at timestamptz,
  sent_result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (master_plan_id, email)
);
alter table new_client_emails enable row level security;
