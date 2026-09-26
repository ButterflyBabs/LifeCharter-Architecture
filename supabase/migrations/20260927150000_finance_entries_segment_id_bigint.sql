-- segment_id was a uuid, but segments use numeric ids, so a ledger entry could never
-- be tagged to a real segment (no entry ever was). Make it a real link.
alter table public.finance_entries drop constraint if exists finance_entries_segment_id_fkey;
alter table public.finance_entries alter column segment_id type bigint using null;
alter table public.finance_entries add constraint finance_entries_segment_id_fkey foreign key (segment_id) references public.segments(id) on delete set null;
create index if not exists finance_entries_segment_idx on public.finance_entries (segment_id) where segment_id is not null;
