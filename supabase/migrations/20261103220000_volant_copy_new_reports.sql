alter table public.volant_settings add column if not exists copy_new_reports boolean not null default true;
comment on column public.volant_settings.copy_new_reports is 'Email the owner a full copy of each new report to their own inbox, as it is written.';
