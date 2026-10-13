-- One row per failed invoice we have told someone about (Stripe retries a failed invoice several times and sends
-- invoice.payment_failed each time; the client and Babs hear about each invoice once).
create table if not exists public.payment_failed_notices (
  invoice_id text primary key,
  user_id uuid,
  created_at timestamptz not null default now()
);
alter table public.payment_failed_notices enable row level security;
