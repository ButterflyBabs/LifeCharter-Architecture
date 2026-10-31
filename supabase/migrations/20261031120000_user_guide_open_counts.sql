-- How often each User Guide entry is opened across client accounts. Totals only: no person, account or date per open.
create table if not exists public.user_guide_opens (
  entry_id text primary key,
  opens integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.user_guide_opens enable row level security;

create or replace function public.bump_user_guide_open(p_entry text) returns void
language sql security definer set search_path = public as $$
  insert into user_guide_opens (entry_id, opens) values (p_entry, 1)
  on conflict (entry_id) do update set opens = user_guide_opens.opens + 1, updated_at = now();
$$;
revoke all on function public.bump_user_guide_open(text) from public, anon, authenticated;
