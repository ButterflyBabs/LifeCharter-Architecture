-- Work Log: a Break button on the clock. break_minutes is time already taken on breaks;
-- break_started_at is set while a break is running. Paid time = clock in to clock out minus breaks.
alter table work_shifts add column if not exists break_minutes integer not null default 0;
alter table work_shifts add column if not exists break_started_at timestamptz;
