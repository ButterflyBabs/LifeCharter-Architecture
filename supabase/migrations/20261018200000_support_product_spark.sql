-- LC Spark joins the one support route (Babs 2026-10-18).
alter table public.support_requests drop constraint if exists support_requests_product_check;
alter table public.support_requests add constraint support_requests_product_check check (product in ('lccs','volant','fledge','spark'));
