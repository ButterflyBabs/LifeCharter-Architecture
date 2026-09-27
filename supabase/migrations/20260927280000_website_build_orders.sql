-- Website Alignment Build sales (Babs, 2026-09-27: $1,997 founding / 2 payments; Claude builds, Babs reviews).
-- Written by the Stripe webhook; read by the owner-only MasterClass results page. Server-only.
create table if not exists public.website_build_orders (
  stripe_checkout_session_id text primary key,
  email text,
  full_name text,
  payment_plan text not null,
  amount_total_cents integer,
  session_source text,
  created_at timestamptz not null default now()
);
alter table public.website_build_orders enable row level security;
revoke all on public.website_build_orders from anon, authenticated;
