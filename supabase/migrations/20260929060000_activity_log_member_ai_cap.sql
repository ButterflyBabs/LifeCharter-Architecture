-- cs184: an activity log the account owner can read, and a per-member monthly AI cap.
-- Additive only.

-- 1. Who did what in an account. Written by the server (service role) after a
--    successful write; read by the owner/admin Activity view. actor_member_id is
--    null when the account owner did it. actor_name is kept so the history still
--    reads well after a member is removed.
create table if not exists public.account_activity (
  id bigserial primary key,
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  actor_member_id uuid references public.workspace_members(id) on delete set null,
  actor_name text not null default '',
  action text not null,          -- created | completed | reopened | reassigned | updated | deleted …
  entity_type text not null,     -- task | finance_entry | bill | deal | sop | goal | content_post | script | sales_activity …
  entity_id text,
  summary text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists account_activity_plan_created_idx on public.account_activity (master_plan_id, created_at desc);
create index if not exists account_activity_plan_actor_idx on public.account_activity (master_plan_id, actor_member_id, created_at desc);
alter table public.account_activity enable row level security;
-- No policies: service role only.

-- 2. Per-member monthly AI request cap (null = no cap). Members draw on the owner's key.
alter table public.workspace_members add column if not exists ai_monthly_cap integer;

-- 3. AI requests each member made per month (month = 'YYYY-MM', UTC).
create table if not exists public.ai_member_usage (
  member_id uuid not null references public.workspace_members(id) on delete cascade,
  month text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (member_id, month)
);
alter table public.ai_member_usage enable row level security;
-- No policies: service role only.

-- Count one AI request for a member, unless it would pass their cap.
-- Returns the new count, or -1 when the cap is already reached (nothing counted).
create or replace function public.bump_member_ai_usage(p_member uuid, p_month text, p_cap integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.ai_member_usage (member_id, month, count)
  values (p_member, p_month, 0)
  on conflict (member_id, month) do nothing;

  update public.ai_member_usage
     set count = count + 1, updated_at = now()
   where member_id = p_member and month = p_month
     and (p_cap is null or count < p_cap)
  returning count into v_count;

  return coalesce(v_count, -1);
end;
$$;
revoke all on function public.bump_member_ai_usage(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.bump_member_ai_usage(uuid, text, integer) to service_role;
