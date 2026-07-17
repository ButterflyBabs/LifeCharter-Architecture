-- Unified Client Memory System
-- Links all assessments (Brain, Soul, Profit) into one evolving client plan

-- ============================================
-- CLIENT MASTER PLAN - The single source of truth
-- ============================================

CREATE TABLE IF NOT EXISTS client_master_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Client identification
    client_name TEXT NOT NULL,
    client_email TEXT,
    
    -- Master plan status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'on_hold')),
    
    -- Assessment tracking - all linked assessments feed into this plan
    brain_assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    soul_assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    profit_assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    quick_pulse_assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    
    -- Unified scoring across all dimensions
    overall_alignment_score INTEGER CHECK (overall_alignment_score BETWEEN 0 AND 100),
    brain_score INTEGER CHECK (brain_score BETWEEN 0 AND 100),
    soul_score INTEGER CHECK (soul_score BETWEEN 0 AND 100),
    profit_score INTEGER CHECK (profit_score BETWEEN 0 AND 100),
    
    -- 12-domain unified scores (aggregated from all assessments)
    domain_scores JSONB DEFAULT '{}', -- {domain_1: {name, score, sources: [...]}, ...}
    
    -- Key insights extracted from all assessments
    key_insights JSONB DEFAULT '[]', -- Array of insight objects
    
    -- Strengths and gaps identified across all assessments
    top_strengths JSONB DEFAULT '[]', -- Top 5 strengths
    priority_gaps JSONB DEFAULT '[]', -- Top 5 gaps to address
    
    -- Recommended next steps (AI-generated or coach-curated)
    recommended_actions JSONB DEFAULT '[]',
    
    -- Progress tracking
    assessments_completed INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    last_assessment_at TIMESTAMPTZ,
    
    -- Plan evolution
    plan_version INTEGER DEFAULT 1,
    plan_history JSONB DEFAULT '[]', -- Snapshot of previous versions
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- ============================================
-- UNIFIED RESPONSES - All answers in one place
-- ============================================

CREATE TABLE IF NOT EXISTS unified_client_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_plan_id UUID REFERENCES client_master_plans(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Source tracking
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('brain', 'soul', 'profit_architecture', 'quick_pulse')),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL, -- Can reference assessment_questions or be embedded
    
    -- Question context (denormalized for quick access)
    question_text TEXT NOT NULL,
    section_name TEXT,
    section_type TEXT,
    
    -- Response data
    answer_value JSONB NOT NULL,
    answer_text TEXT,
    
    -- AI-extracted insights from this response
    extracted_insights JSONB DEFAULT '[]', -- Key points, patterns, flags
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'concern')),
    priority_level TEXT CHECK (priority_level IN ('critical', 'high', 'medium', 'low')),
    
    -- Cross-assessment linking
    related_response_ids UUID[], -- Links to related answers in other assessments
    
    -- Scoring
    score INTEGER,
    max_score INTEGER,
    
    -- Metadata
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(master_plan_id, assessment_type, question_id)
);

-- ============================================
-- CLIENT INSIGHTS - AI/Coach generated insights
-- ============================================

CREATE TABLE IF NOT EXISTS client_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_plan_id UUID REFERENCES client_master_plans(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Insight categorization
    insight_type TEXT NOT NULL CHECK (insight_type IN (
        'pattern', 'strength', 'gap', 'opportunity', 'risk', 'recommendation', 'milestone'
    )),
    
    -- Source of insight
    source TEXT NOT NULL CHECK (source IN ('ai_analysis', 'coach', 'system', 'client')),
    source_assessment_types TEXT[], -- Which assessments contributed
    
    -- Insight content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '[]', -- Supporting data points from responses
    
    -- Related responses
    related_response_ids UUID[] REFERENCES unified_client_responses(id),
    
    -- Priority and status
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'addressed', 'dismissed', 'in_progress')),
    
    -- Action tracking
    action_taken TEXT,
    action_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- ============================================
-- CLIENT ACTION PLAN - Evolving todo list
-- ============================================

CREATE TABLE IF NOT EXISTS client_action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_plan_id UUID REFERENCES client_master_plans(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Action details
    title TEXT NOT NULL,
    description TEXT,
    
    -- Source (which assessment/insight generated this)
    source_type TEXT CHECK (source_type IN ('brain_assessment', 'soul_assessment', 'profit_assessment', 'insight', 'coach', 'client')),
    source_id UUID, -- Reference to insight or assessment
    
    -- Categorization
    category TEXT CHECK (category IN ('brain', 'soul', 'profit', 'integration', 'general')),
    domain_number INTEGER CHECK (domain_number BETWEEN 1 AND 12),
    
    -- Priority and status
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'deferred', 'cancelled')),
    
    -- Timing
    due_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Assignment
    assigned_to UUID REFERENCES profiles(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLIENT SNAPSHOTS - Point-in-time summaries
-- ============================================

CREATE TABLE IF NOT EXISTS client_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_plan_id UUID REFERENCES client_master_plans(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Snapshot trigger
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('assessment_completed', 'milestone', 'manual', 'scheduled')),
    trigger_assessment_id UUID REFERENCES assessments(id),
    
    -- Snapshot data
    snapshot_data JSONB NOT NULL, -- Complete snapshot of client state
    
    -- Key highlights
    highlights TEXT[],
    concerns TEXT[],
    wins TEXT[],
    
    -- Comparison to previous
    changes_from_previous JSONB, -- What changed since last snapshot
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE client_master_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_client_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_snapshots ENABLE ROW LEVEL SECURITY;

-- Client master plans policies
CREATE POLICY "Users can view their own master plans"
    ON client_master_plans FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_memberships
        WHERE workspace_id = client_master_plans.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'coach')
    ));

CREATE POLICY "Users can create their own master plans"
    ON client_master_plans FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own master plans"
    ON client_master_plans FOR UPDATE
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_memberships
        WHERE workspace_id = client_master_plans.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'coach')
    ));

-- Unified responses policies
CREATE POLICY "Users can view their unified responses"
    ON unified_client_responses FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_memberships
        WHERE workspace_id = unified_client_responses.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'coach')
    ));

CREATE POLICY "Users can create their unified responses"
    ON unified_client_responses FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their unified responses"
    ON unified_client_responses FOR UPDATE
    USING (user_id = auth.uid());

-- Client insights policies
CREATE POLICY "Users can view insights for their plans"
    ON client_insights FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_memberships
        WHERE workspace_id = client_insights.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'coach')
    ));

CREATE POLICY "Users and coaches can create insights"
    ON client_insights FOR INSERT
    WITH CHECK (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_memberships
        WHERE workspace_id = client_insights.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'coach')
    ));

-- Action items policies
CREATE POLICY "Users can view their action items"
    ON client_action_items FOR SELECT
    USING (user_id = auth.uid() OR assigned_to = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_memberships
        WHERE workspace_id = client_action_items.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'coach')
    ));

CREATE POLICY "Users can manage their action items"
    ON client_action_items FOR ALL
    USING (user_id = auth.uid() OR assigned_to = auth.uid());

-- Snapshots policies
CREATE POLICY "Users can view their snapshots"
    ON client_snapshots FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_memberships
        WHERE workspace_id = client_snapshots.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'coach')
    ));

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_client_master_plans_workspace ON client_master_plans(workspace_id);
CREATE INDEX idx_client_master_plans_user ON client_master_plans(user_id);
CREATE INDEX idx_client_master_plans_status ON client_master_plans(status);

CREATE INDEX idx_unified_responses_master_plan ON unified_client_responses(master_plan_id);
CREATE INDEX idx_unified_responses_assessment_type ON unified_client_responses(assessment_type);
CREATE INDEX idx_unified_responses_section ON unified_client_responses(section_type);

CREATE INDEX idx_client_insights_master_plan ON client_insights(master_plan_id);
CREATE INDEX idx_client_insights_type ON client_insights(insight_type);
CREATE INDEX idx_client_insights_priority ON client_insights(priority);

CREATE INDEX idx_client_action_items_master_plan ON client_action_items(master_plan_id);
CREATE INDEX idx_client_action_items_status ON client_action_items(status);
CREATE INDEX idx_client_action_items_assigned ON client_action_items(assigned_to);

CREATE INDEX idx_client_snapshots_master_plan ON client_snapshots(master_plan_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps
CREATE TRIGGER update_client_master_plans_updated_at
    BEFORE UPDATE ON client_master_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unified_client_responses_updated_at
    BEFORE UPDATE ON unified_client_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_insights_updated_at
    BEFORE UPDATE ON client_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_action_items_updated_at
    BEFORE UPDATE ON client_action_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create snapshot when assessment is completed
CREATE OR REPLACE FUNCTION create_client_snapshot_on_assessment_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- This will be called by application code to create a proper snapshot
        -- Trigger just marks that snapshot is needed
        UPDATE client_master_plans
        SET 
            last_assessment_at = NOW(),
            updated_at = NOW()
        WHERE brain_assessment_id = NEW.id 
           OR soul_assessment_id = NEW.id 
           OR profit_assessment_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER snapshot_on_assessment_complete
    AFTER UPDATE ON assessments
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION create_client_snapshot_on_assessment_complete();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to aggregate all responses into unified view
CREATE OR REPLACE FUNCTION get_unified_client_profile(p_master_plan_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'master_plan', row_to_json(cmp),
        'brain_responses', (
            SELECT jsonb_agg(row_to_json(ucr))
            FROM unified_client_responses ucr
            WHERE ucr.master_plan_id = p_master_plan_id
            AND ucr.assessment_type = 'brain'
        ),
        'soul_responses', (
            SELECT jsonb_agg(row_to_json(ucr))
            FROM unified_client_responses ucr
            WHERE ucr.master_plan_id = p_master_plan_id
            AND ucr.assessment_type = 'soul'
        ),
        'profit_responses', (
            SELECT jsonb_agg(row_to_json(ucr))
            FROM unified_client_responses ucr
            WHERE ucr.master_plan_id = p_master_plan_id
            AND ucr.assessment_type = 'profit_architecture'
        ),
        'insights', (
            SELECT jsonb_agg(row_to_json(ci))
            FROM client_insights ci
            WHERE ci.master_plan_id = p_master_plan_id
            AND ci.status = 'active'
            ORDER BY ci.priority, ci.created_at DESC
        ),
        'action_items', (
            SELECT jsonb_agg(row_to_json(cai))
            FROM client_action_items cai
            WHERE cai.master_plan_id = p_master_plan_id
            AND cai.status IN ('pending', 'in_progress')
            ORDER BY cai.priority, cai.due_date
        )
    )
    INTO result
    FROM client_master_plans cmp
    WHERE cmp.id = p_master_plan_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate unified scores across all assessments
CREATE OR REPLACE FUNCTION calculate_unified_scores(p_master_plan_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE client_master_plans
    SET
        brain_score = (
            SELECT COALESCE(AVG(score), 0)
            FROM unified_client_responses
            WHERE master_plan_id = p_master_plan_id
            AND assessment_type = 'brain'
            AND score IS NOT NULL
        ),
        soul_score = (
            SELECT COALESCE(AVG(score), 0)
            FROM unified_client_responses
            WHERE master_plan_id = p_master_plan_id
            AND assessment_type = 'soul'
            AND score IS NOT NULL
        ),
        profit_score = (
            SELECT COALESCE(AVG(score), 0)
            FROM unified_client_responses
            WHERE master_plan_id = p_master_plan_id
            AND assessment_type = 'profit_architecture'
            AND score IS NOT NULL
        ),
        overall_alignment_score = (
            SELECT COALESCE(AVG(score), 0)
            FROM unified_client_responses
            WHERE master_plan_id = p_master_plan_id
            AND score IS NOT NULL
        ),
        updated_at = NOW()
    WHERE id = p_master_plan_id;
END;
$$ LANGUAGE plpgsql;
