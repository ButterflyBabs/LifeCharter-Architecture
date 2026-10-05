-- Tag Library: an optional note per tag (what it means, when to use it), one per account.
create table if not exists public.crm_tag_notes (
  master_plan_id uuid not null,
  tag text not null,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (master_plan_id, tag)
);
alter table public.crm_tag_notes enable row level security;
revoke all on public.crm_tag_notes from anon, authenticated;
