-- Calls attended and purchases added by hand on a contact (the Suite also finds
-- completed bookings, MasterClass attendance, purchases and won deals on its own).
create table if not exists contact_records (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  contact_id uuid not null references seq_contacts(id) on delete cascade,
  kind text not null check (kind in ('attended', 'purchase')),
  title text not null,
  occurred_on date not null default current_date,
  amount numeric,
  offer_id uuid references sales_offers(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists contact_records_contact on contact_records (contact_id, kind, occurred_on desc);
alter table contact_records enable row level security;
