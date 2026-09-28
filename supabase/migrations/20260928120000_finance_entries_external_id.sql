-- Payment sync: each synced ledger line remembers its source id (e.g. a Stripe balance transaction), so a re-sync never duplicates it.
alter table public.finance_entries add column if not exists external_id text;
create unique index if not exists finance_entries_external_uniq on public.finance_entries (master_plan_id, external_id);
