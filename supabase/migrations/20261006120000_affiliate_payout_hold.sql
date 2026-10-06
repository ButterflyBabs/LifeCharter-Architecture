-- Affiliate payout hold: pay a commission N days after the customer's payment was taken
-- (a refund window). affiliates.payout_delay_days is that N (empty = no hold);
-- affiliate_sales.payable_on is the first day the commission can be paid.
alter table affiliates add column if not exists payout_delay_days integer check (payout_delay_days is null or (payout_delay_days between 0 and 365));
alter table affiliate_sales add column if not exists payable_on date;
