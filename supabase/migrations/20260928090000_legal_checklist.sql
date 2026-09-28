-- Legal & Compliance checklist: each client's status per item (catalog lives in code; custom items use item_key 'custom:<uuid>').
create table if not exists public.legal_checklist (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  item_key text not null,
  status text not null default 'not_started' check (status in ('not_started','in_progress','done','na')),
  due_date date,
  notes text,
  doc_link text,
  custom_title text,
  custom_group text,
  updated_at timestamptz not null default now(),
  unique (master_plan_id, item_key)
);
alter table public.legal_checklist enable row level security;
