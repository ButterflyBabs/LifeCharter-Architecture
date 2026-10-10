-- Pre-Founder six free months: one row per notice sent, so each notice goes out exactly once.
create table if not exists public.pre_founder_trial_notices (
  email text not null,
  notice text not null,            -- 'month5_alert' | 'month5_client' | 'trial_end_alert'
  sent_at timestamptz not null default now(),
  primary key (email, notice)
);
alter table public.pre_founder_trial_notices enable row level security;
