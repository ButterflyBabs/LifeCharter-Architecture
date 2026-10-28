-- Quebec QST and provincial sales tax in BC, Saskatchewan and Manitoba (follow-up to GST/HST, task 1529).
-- Registrations live in sales_tax_settings.provincial: { "QC": { registered, number, frequency }, "BC": {...}, ... }.
-- QST follows GST/HST on every item; PST/RST only on items ticked pst_applies (most coaching is not subject to PST).
-- Provincial tax is kept apart from GST/HST (different returns): prov_tax_amount, with the province in tax_province.
alter table public.sales_tax_settings add column if not exists provincial jsonb not null default '{}'::jsonb;
alter table public.sales_offers add column if not exists pst_applies boolean not null default false;
alter table public.booking_calendars add column if not exists pst_applies boolean not null default false;
alter table public.suite_invoices add column if not exists pst_applies boolean not null default false;
alter table public.suite_invoices add column if not exists prov_tax_amount numeric not null default 0;
alter table public.suite_payments add column if not exists prov_tax_amount numeric not null default 0;
alter table public.finance_entries add column if not exists prov_tax_amount numeric not null default 0;
