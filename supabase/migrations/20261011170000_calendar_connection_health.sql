-- Calendar connections that stop working: remembered here so the account holder is told (bell + email) the moment it
-- happens, not when someone finds an empty booking page. Set and cleared by /api/cron/calendar-connections.
alter table booking_connections add column if not exists broken_at timestamptz;
alter table booking_connections add column if not exists broken_reason text;
alter table booking_connections add column if not exists alerted_at timestamptz;
