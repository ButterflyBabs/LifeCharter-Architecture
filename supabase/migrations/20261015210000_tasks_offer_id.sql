-- A task can belong to one of the client's offers (Offers & Packages), beside the project it already may belong to.
alter table public.tasks add column if not exists offer_id uuid references public.sales_offers(id) on delete set null;
create index if not exists tasks_offer_id_idx on public.tasks (offer_id) where offer_id is not null;
