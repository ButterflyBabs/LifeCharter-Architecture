-- Each account can rewrite the ready-made Quick Win emails in its own voice. One saved wording per account per Quick Win email.
-- The text keeps {{first_name}} and {{my_name}} so the person's name and the account owner's name are filled in at send time.
create table if not exists quick_win_email_templates (
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  kind text not null,
  subject text not null,
  body text not null,
  updated_at timestamptz not null default now(),
  primary key (master_plan_id, kind)
);
alter table quick_win_email_templates enable row level security;
