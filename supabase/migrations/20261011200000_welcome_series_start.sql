-- Lets a client be put back into the New Client Welcome series "as if they joined today": the daily series counts its
-- days (3, 5, 10, 14) from this date instead of the account's created date. The account's real join date is untouched.
create table if not exists lccs_welcome_series_start (
  user_id uuid primary key,
  started_on date not null,
  set_at timestamptz not null default now()
);
alter table lccs_welcome_series_start enable row level security;
