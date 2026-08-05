-- Living per-client plans: AI-generated Business / Marketing / Sales plans,
-- versioned so edits and additions accumulate instead of overwriting, with
-- checkable goals tied to the 12 dimensions. Keyed on master_plan_id, which is
-- the per-client key (client_master_plans.user_id) — so these become per-client
-- automatically once auth is on.

CREATE TABLE IF NOT EXISTS client_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_plan_id UUID REFERENCES client_master_plans(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('business', 'marketing', 'sales')),
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'superseded')),
    generated_by TEXT NOT NULL DEFAULT 'ai' CHECK (generated_by IN ('ai', 'coach', 'client')),
    title TEXT,
    summary TEXT,                        -- narrative overview
    source_snapshot JSONB DEFAULT '{}',  -- provenance: scores / inputs the plan was generated from
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_plan_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES client_plans(id) ON DELETE CASCADE,
    dimension_key TEXT,                  -- ties to a 12-dimension key; NULL for general goals
    title TEXT NOT NULL,
    detail TEXT,
    target TEXT,                         -- measurable target, if any (what a check-in scores against)
    status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'met', 'slipped')),
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),  -- evolution anchor: a goal added later baselines from here
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_plans_lookup ON client_plans(master_plan_id, plan_type, status);
CREATE INDEX IF NOT EXISTS idx_client_plan_goals_plan ON client_plan_goals(plan_id);

-- One active version per (client, plan_type) at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_plan
    ON client_plans(master_plan_id, plan_type)
    WHERE status = 'active';

-- Enable RLS. The app writes/reads via the service role (which bypasses RLS),
-- so nothing breaks today; with no client-facing policy yet, anon/authenticated
-- callers get no direct access. Per-user owner policies land with the auth
-- foundation.
ALTER TABLE client_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_plan_goals ENABLE ROW LEVEL SECURITY;
