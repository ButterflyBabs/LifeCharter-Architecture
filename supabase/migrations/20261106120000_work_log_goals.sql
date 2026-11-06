-- Work Log: a weekly hours goal per team member (for people paid a flat weekly amount rather than by the hour).
-- The account owner sets it; the person sees their own goal and progress, never anyone else's.
create table if not exists public.work_log_goals (
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  person_email text not null,
  weekly_hours numeric(5,2) not null check (weekly_hours > 0 and weekly_hours <= 168),
  updated_at timestamptz not null default now(),
  primary key (master_plan_id, person_email)
);
alter table public.work_log_goals enable row level security;
comment on table public.work_log_goals is 'Work Log: weekly hours goal per team member, set by the account owner.';
