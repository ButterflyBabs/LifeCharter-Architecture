-- Expenses: who was paid, and whether the payment is one-time or recurring (with how often and
-- whether it renews itself or has to be renewed by hand). A recurring expense also creates a bill
-- (Bills & cash calendar) so its next renewal shows up on its own.
alter table public.finance_bills add column if not exists vendor text;
alter table public.finance_bills drop constraint if exists finance_bills_cadence_check;
alter table public.finance_bills add constraint finance_bills_cadence_check
  check (cadence in ('weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'once'));

alter table public.finance_entries add column if not exists vendor text;
alter table public.finance_entries add column if not exists payment_type text not null default 'one_time'
  check (payment_type in ('one_time', 'recurring'));
alter table public.finance_entries add column if not exists frequency text
  check (frequency in ('weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'));
alter table public.finance_entries add column if not exists renewal text
  check (renewal in ('auto', 'manual'));
alter table public.finance_entries add column if not exists bill_id uuid
  references public.finance_bills(id) on delete set null;
