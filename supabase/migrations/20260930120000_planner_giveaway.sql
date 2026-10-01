-- Free planner giveaway: one free planner per email address. Each claim gets its
-- own single-use 100%-off Payhip code for the planner the person chose.
create table if not exists planner_giveaway_claims (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  contact_id uuid references seq_contacts(id) on delete set null,
  email text not null,
  planner text not null,
  coupon_code text,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (master_plan_id, email)
);
alter table planner_giveaway_claims enable row level security;

-- Set when the buyer actually uses their free code on Payhip (Payhip webhook).
alter table planner_giveaway_claims add column if not exists redeemed_at timestamptz;
