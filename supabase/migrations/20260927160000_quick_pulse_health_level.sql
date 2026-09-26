-- The Quick Pulse check-in page saves a health label with each check-in, but the
-- column was never created, so every check-in failed on insert.
ALTER TABLE quick_pulse_checkins ADD COLUMN IF NOT EXISTS health_level text;
