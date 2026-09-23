-- Collective Plus ($9.99/mo · $99/yr · founding $7/mo or $70/yr for life):
-- Mariposa for members who aren't Command Suite clients, plus the Sunday
-- week-in-review, monthly alignment report, Ask the Library, 90-day focus,
-- journal export and a Plus badge.

-- Billing state — written only by the server (Stripe checkout/webhook, or an
-- admin comp). A member can read their own row; nobody else can.
create table if not exists public.cm_plus_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'comp')),
  plan text check (plan in ('monthly', 'annual', 'comp')),
  founding boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cm_plus_subscriptions enable row level security;
create policy cm_plus_own on public.cm_plus_subscriptions for select to authenticated using (user_id = auth.uid());

create or replace function public.cm_is_plus(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from cm_plus_subscriptions where user_id = p_user and status in ('active', 'trialing', 'past_due', 'comp'));
$$;

-- Who wears the Plus badge (ids only — no billing details).
create or replace function public.cm_plus_member_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select user_id from cm_plus_subscriptions where status in ('active', 'trialing', 'past_due', 'comp') and cm_in_collective();
$$;

-- Founding spots taken (ever).
create or replace function public.cm_plus_founding_taken()
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from cm_plus_subscriptions where founding;
$$;

-- Admins can comp (gift) or remove Plus.
create or replace function public.cm_admin_set_plus(p_user uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not cm_is_admin() then raise exception 'not allowed'; end if;
  if p_on then
    insert into cm_plus_subscriptions (user_id, status, plan) values (p_user, 'comp', 'comp')
    on conflict (user_id) do update set status = 'comp', plan = 'comp', updated_at = now()
      where cm_plus_subscriptions.status not in ('active', 'trialing', 'past_due');
  else
    delete from cm_plus_subscriptions where user_id = p_user and status = 'comp';
  end if;
end;
$$;

revoke all on function public.cm_is_plus(uuid) from public, anon;
revoke all on function public.cm_plus_member_ids() from public, anon;
revoke all on function public.cm_plus_founding_taken() from public, anon;
revoke all on function public.cm_admin_set_plus(uuid, boolean) from public, anon;
grant execute on function public.cm_is_plus(uuid), public.cm_plus_member_ids(), public.cm_plus_founding_taken(), public.cm_admin_set_plus(uuid, boolean) to authenticated, service_role;

-- AI usage log (server-only) — powers the per-member monthly cap.
create table if not exists public.cm_ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  source text not null check (source in ('own', 'plus')),
  created_at timestamptz not null default now()
);
create index if not exists cm_ai_usage_user_idx on public.cm_ai_usage (user_id, created_at desc);
alter table public.cm_ai_usage enable row level security;

-- 90-day focus: one bigger goal weekly intentions roll up into.
create table if not exists public.cm_journal_focus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  why text,
  starts_on date not null default current_date,
  ends_on date not null default (current_date + 90),
  status text not null default 'active' check (status in ('active', 'done', 'released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cm_journal_focus_user_idx on public.cm_journal_focus (user_id, starts_on desc);
alter table public.cm_journal_focus enable row level security;
create policy cm_journal_focus_owner on public.cm_journal_focus for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and cm_in_collective());
alter table public.cm_journal_entries add column if not exists focus_id uuid references public.cm_journal_focus(id) on delete set null;

-- Mariposa's Sunday week-in-review, one per member per week (private).
create table if not exists public.cm_journal_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  body jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);
alter table public.cm_journal_reviews enable row level security;
create policy cm_journal_reviews_owner_read on public.cm_journal_reviews for select to authenticated using (user_id = auth.uid());
create policy cm_journal_reviews_owner_delete on public.cm_journal_reviews for delete to authenticated using (user_id = auth.uid());

-- What Mariposa knows about each Library item (pasted by an admin or pulled
-- from the uploaded file) — used to answer "Ask the Library".
alter table public.cm_resources add column if not exists ai_text text;

-- Admins: which members pay for Plus (vs gifted), so paid Plus can't be removed by mistake.
create or replace function public.cm_admin_plus_paid_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select user_id from cm_plus_subscriptions where cm_is_admin() and status in ('active', 'trialing', 'past_due');
$$;
revoke all on function public.cm_admin_plus_paid_ids() from public, anon;
grant execute on function public.cm_admin_plus_paid_ids() to authenticated;

-- The member's email at checkout, so a later Command Suite purchase can
-- credit their last month of Plus.
alter table public.cm_plus_subscriptions add column if not exists email text;
create index if not exists cm_plus_email_idx on public.cm_plus_subscriptions (lower(email));
