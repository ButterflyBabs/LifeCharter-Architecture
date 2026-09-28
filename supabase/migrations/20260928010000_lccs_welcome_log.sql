-- Command Suite new-client welcome sequence: one row per email sent to a client, so each email
-- goes out at most once (the insert is the lock: only the request that inserts it sends).
create table if not exists public.lccs_welcome_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  email_key text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, email_key)
);
alter table public.lccs_welcome_log enable row level security;
revoke all on public.lccs_welcome_log from anon, authenticated;
