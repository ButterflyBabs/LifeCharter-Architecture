-- LCCS New Client Welcome: one-off resends. The log keeps its single row per person and email
-- (so the daily run can never double-send); a resend just counts itself here.
alter table lccs_welcome_log add column if not exists resend_count integer not null default 0;
alter table lccs_welcome_log add column if not exists last_resent_at timestamptz;

-- Pause or stop: a row marked stopped means "this email was held back on purpose for this person" (it was
-- never sent), so the daily run and the 3-minute send both leave it alone. The series can also be paused for
-- everyone with app_settings welcome_series_paused = "true".
alter table lccs_welcome_log add column if not exists stopped boolean not null default false;
