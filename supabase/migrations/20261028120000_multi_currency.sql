-- Multi-currency (task 1520): each account picks a default currency (USD or CAD), and every priced or money row
-- carries its own currency so CAD and USD are kept apart. Existing rows all get 'usd' (nothing stored changes value).
alter table public.client_master_plans add column if not exists default_currency text not null default 'usd';
alter table public.client_master_plans drop constraint if exists client_master_plans_default_currency_check;
alter table public.client_master_plans add constraint client_master_plans_default_currency_check check (default_currency in ('usd','cad'));

do $$
declare t text;
begin
  foreach t in array array['sales_offers','offer_payment_links','suite_invoices','pipeline_deals','finance_bills','finance_entries','booking_calendars','bookings','sign_documents'] loop
    execute format('alter table public.%I add column if not exists currency text not null default %L', t, 'usd');
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_currency_check');
    execute format('alter table public.%I add constraint %I check (currency in (%L,%L))', t, t || '_currency_check', 'usd', 'cad');
  end loop;
end $$;
