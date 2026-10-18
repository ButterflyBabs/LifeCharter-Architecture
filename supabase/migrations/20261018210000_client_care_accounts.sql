-- Client Care for every account (task 1148, approved by Babs 2026-10-18). Each account gets the client versions of the
-- 30-day check-in, quarterly pulse and exit survey (form + email) and the quiet-client notes, switched OFF; the switches
-- live on the forms and series themselves (active). This row holds the rest: the quiet-client task switch and the
-- booking calendar the third quiet note links to.
create table if not exists public.client_care_settings (
  master_plan_id uuid primary key references public.client_master_plans(id) on delete cascade,
  quiet_on boolean not null default false,
  booking_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.client_care_settings enable row level security;
