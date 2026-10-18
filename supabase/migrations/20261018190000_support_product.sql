-- One support route for every LifeCharter app (task 1145, Babs 2026-10-18): LC Volant and LC Fledge requests land in
-- the same Support Desk as the Command Suite's, tagged with the app they came from.
alter table public.support_requests add column if not exists product text not null default 'lccs';
alter table public.support_requests drop constraint if exists support_requests_product_check;
alter table public.support_requests add constraint support_requests_product_check check (product in ('lccs','volant','fledge'));
