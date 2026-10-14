-- Platform Costs (Alignment Architect, Babs only): the real monthly bills behind hosting, database, AI and tools,
-- so cost per client can be tracked over time. One row per bill. Receipts found in the house mailbox arrive as
-- 'proposed' and count only after Babs confirms them; typed-in rows are confirmed straight away.
create table if not exists public.platform_cost_entries (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  month date not null,                         -- first day of the month the bill belongs to
  vendor text not null,                        -- 'vercel' | 'supabase' | 'anthropic' | ... | 'other'
  label text,                                  -- free text, e.g. "Main org" or "Old dashboard org"
  amount_cents integer not null,               -- negative for a refund
  counts boolean not null default true,        -- false = not a platform cost (e.g. personal Claude use)
  status text not null default 'proposed',     -- 'proposed' | 'confirmed' | 'rejected'
  source text not null default 'manual',       -- 'receipt' | 'manual'
  receipt_ref text,                            -- mailbox message id the amount was read from
  receipt_subject text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists platform_cost_entries_receipt_uq on public.platform_cost_entries (master_plan_id, receipt_ref) where receipt_ref is not null;
create index if not exists platform_cost_entries_month_idx on public.platform_cost_entries (master_plan_id, month);
alter table public.platform_cost_entries enable row level security;
