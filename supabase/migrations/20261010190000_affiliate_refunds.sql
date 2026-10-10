-- Affiliate refunds. When Stripe refunds a payment that was credited to an affiliate:
--   * a sale that is still inside its payout hold and not yet paid is voided (the row stays; the reason and the Stripe
--     refund id are recorded here);
--   * a sale that was already paid (or whose hold has ended) is left as it is and flagged for the account owner to review.
-- Additive only. status keeps its four values; the flag is its own column so a paid sale stays "paid".
alter table public.affiliate_sales add column if not exists refund_ref text;
alter table public.affiliate_sales add column if not exists refunded_at timestamptz;
alter table public.affiliate_sales add column if not exists void_reason text;
alter table public.affiliate_sales add column if not exists refund_flag boolean not null default false;
alter table public.affiliate_sales add column if not exists refund_note text;
create index if not exists affiliate_sales_refund_flag on public.affiliate_sales (master_plan_id) where refund_flag;
