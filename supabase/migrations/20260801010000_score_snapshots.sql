-- Dated snapshots of a client's 12-dimension scores, so progress can be measured
-- as movement over time rather than "latest vs latest". The first snapshot is
-- the immutable baseline (captured when the client finishes their initial
-- assessments); each subsequent recompute / check-in adds a new dated point.
-- Keyed on master_plan_id (per-client).

CREATE TABLE IF NOT EXISTS client_score_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_plan_id UUID REFERENCES client_master_plans(id) ON DELETE CASCADE,
    snapshot_type TEXT NOT NULL DEFAULT 'checkin'
        CHECK (snapshot_type IN ('baseline', 'checkin', 'recompute')),
    overall INTEGER,                     -- 0-100 overall at capture time (nullable)
    domains JSONB NOT NULL DEFAULT '{}', -- { "marketing": 72, "sales": 60, ... }
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_snapshots_lookup
    ON client_score_snapshots(master_plan_id, created_at);

-- At most one baseline per client.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_baseline_per_plan
    ON client_score_snapshots(master_plan_id)
    WHERE snapshot_type = 'baseline';

ALTER TABLE client_score_snapshots ENABLE ROW LEVEL SECURITY;
