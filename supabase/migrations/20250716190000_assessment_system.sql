-- Assessment System Migration for LifeCharter Architecture
-- Phase 2: Assessment Engine & Dashboard Shell

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ASSESSMENT TYPES AND STRUCTURE
-- ============================================

-- Main assessments table (Brain, Soul, Profit Architecture)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Assessment type
    type TEXT NOT NULL CHECK (type IN ('quick_pulse', 'brain', 'soul', 'profit_architecture', 'full_alignment')),
    
    -- Status tracking
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused', 'abandoned')),
    
    -- Progress tracking
    total_questions INTEGER DEFAULT 0,
    answered_questions INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    
    -- Scoring
    overall_score INTEGER, -- 0-100
    score_breakdown JSONB DEFAULT '{}', -- Detailed scoring by section/domain
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    estimated_duration_minutes INTEGER, -- Estimated time to complete
    actual_duration_minutes INTEGER, -- Actual time taken
    
    -- Metadata
    version TEXT DEFAULT '1.0',
    source TEXT DEFAULT 'web_app', -- web_app, mobile, import, etc.
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment sections (grouping questions)
CREATE TABLE IF NOT EXISTS assessment_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    
    -- Section details
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Section type and ordering
    section_type TEXT NOT NULL, -- e.g., 'cognitive_patterns', 'emotional_resilience', 'revenue_model'
    sort_order INTEGER DEFAULT 0,
    
    -- Progress tracking
    total_questions INTEGER DEFAULT 0,
    answered_questions INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Scoring for this section
    section_score INTEGER,
    max_score INTEGER,
    weight DECIMAL(3,2) DEFAULT 1.0, -- Weight in overall calculation
    
    -- Branching logic
    show_if_parent_answered UUID, -- Reference to question that must be answered
    show_if_parent_value JSONB, -- Value(s) that trigger showing this section
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment questions (question bank)
CREATE TABLE IF NOT EXISTS assessment_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Question categorization
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quick_pulse', 'brain', 'soul', 'profit_architecture', 'all')),
    section_type TEXT NOT NULL, -- Matches assessment_sections.section_type
    
    -- Question content
    question_text TEXT NOT NULL,
    question_subtext TEXT,
    help_text TEXT,
    
    -- Question type
    question_type TEXT NOT NULL DEFAULT 'single_choice' 
        CHECK (question_type IN ('single_choice', 'multiple_choice', 'scale', 'text', 'yes_no', 'ranking', 'matrix')),
    
    -- Options for choice-based questions
    options JSONB, -- Array of {value, label, score, icon}
    
    -- Scale configuration
    scale_config JSONB, -- {min, max, step, labels: {min_label, max_label}}
    
    -- Validation
    is_required BOOLEAN DEFAULT TRUE,
    validation_rules JSONB, -- {min_length, max_length, pattern}
    
    -- Sensitive content flag
    is_sensitive BOOLEAN DEFAULT FALSE, -- For Soul assessment sensitive questions
    
    -- Scoring
    scoring_logic JSONB, -- How to calculate score from answer
    
    -- Metadata
    version TEXT DEFAULT '1.0',
    tags TEXT[], -- For filtering and organization
    metadata JSONB DEFAULT '{}',
    
    -- Ordering
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User responses to questions
CREATE TABLE IF NOT EXISTS assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    section_id UUID REFERENCES assessment_sections(id) ON DELETE CASCADE,
    question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE,
    
    -- Response data
    answer_value JSONB NOT NULL, -- Stored as JSON to handle various types
    answer_text TEXT, -- For text responses
    
    -- Scoring
    score INTEGER, -- Calculated score for this response
    max_score INTEGER,
    
    -- Timing
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent_seconds INTEGER, -- How long user spent on this question
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(assessment_id, question_id)
);

-- ============================================
-- DOMAIN SCORES (12-Domain Architecture)
-- ============================================

-- Domain scores for tracking across all assessments
CREATE TABLE IF NOT EXISTS domain_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    
    -- Domain identification (1-12)
    domain_number INTEGER NOT NULL CHECK (domain_number BETWEEN 1 AND 12),
    domain_name TEXT NOT NULL,
    
    -- Scoring
    current_score INTEGER NOT NULL CHECK (current_score BETWEEN 0 AND 100),
    previous_score INTEGER, -- For tracking change
    target_score INTEGER DEFAULT 80, -- User's target
    
    -- Score breakdown
    score_components JSONB DEFAULT '{}', -- Breakdown by sub-category
    
    -- Trend tracking
    trend_direction TEXT CHECK (trend_direction IN ('improving', 'stable', 'declining')),
    trend_percentage DECIMAL(5,2),
    
    -- Metadata
    assessed_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ, -- When should reassessment occur
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(workspace_id, user_id, domain_number, assessed_at)
);

-- Domain score history for trend analysis
CREATE TABLE IF NOT EXISTS domain_score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_score_id UUID REFERENCES domain_scores(id) ON DELETE CASCADE,
    
    score INTEGER NOT NULL,
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    metadata JSONB DEFAULT '{}'
);

-- ============================================
-- ASSESSMENT CONFIGURATION
-- ============================================

-- Assessment templates for creating new assessments
CREATE TABLE IF NOT EXISTS assessment_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name TEXT NOT NULL,
    description TEXT,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quick_pulse', 'brain', 'soul', 'profit_architecture', 'full_alignment')),
    
    -- Configuration
    config JSONB NOT NULL, -- Full template configuration
    
    -- Sections and questions (embedded for portability)
    sections JSONB NOT NULL,
    
    -- Versioning
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_templates ENABLE ROW LEVEL SECURITY;

-- Assessments policies
CREATE POLICY "Users can view their own assessments"
    ON assessments FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_memberships
        WHERE workspace_id = assessments.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'coach')
    ));

CREATE POLICY "Users can create their own assessments"
    ON assessments FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own assessments"
    ON assessments FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own assessments"
    ON assessments FOR DELETE
    USING (user_id = auth.uid());

-- Assessment sections policies
CREATE POLICY "Users can view sections of their assessments"
    ON assessment_sections FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM assessments
        WHERE id = assessment_sections.assessment_id
        AND (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_id = assessments.workspace_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin', 'coach')
        ))
    ));

CREATE POLICY "Users can manage sections of their assessments"
    ON assessment_sections FOR ALL
    USING (EXISTS (
        SELECT 1 FROM assessments
        WHERE id = assessment_sections.assessment_id
        AND user_id = auth.uid()
    ));

-- Assessment questions policies (public read for active questions)
CREATE POLICY "Anyone can view active questions"
    ON assessment_questions FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Only admins can manage questions"
    ON assessment_questions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('owner', 'admin')
    ));

-- Assessment responses policies
CREATE POLICY "Users can view their own responses"
    ON assessment_responses FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM assessments
        WHERE id = assessment_responses.assessment_id
        AND (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_id = assessments.workspace_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin', 'coach')
        ))
    ));

CREATE POLICY "Users can create their own responses"
    ON assessment_responses FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM assessments
        WHERE id = assessment_responses.assessment_id
        AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own responses"
    ON assessment_responses FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM assessments
        WHERE id = assessment_responses.assessment_id
        AND user_id = auth.uid()
    ));

-- Domain scores policies
CREATE POLICY "Users can view their domain scores"
    ON domain_scores FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_memberships
        WHERE workspace_id = domain_scores.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'coach')
    ));

CREATE POLICY "Users can manage their domain scores"
    ON domain_scores FOR ALL
    USING (user_id = auth.uid());

-- Assessment templates policies (public read for active templates)
CREATE POLICY "Anyone can view active templates"
    ON assessment_templates FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Only admins can manage templates"
    ON assessment_templates FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('owner', 'admin')
    ));

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_assessments_workspace ON assessments(workspace_id);
CREATE INDEX idx_assessments_user ON assessments(user_id);
CREATE INDEX idx_assessments_type ON assessments(type);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_created ON assessments(created_at);

CREATE INDEX idx_assessment_sections_assessment ON assessment_sections(assessment_id);
CREATE INDEX idx_assessment_sections_type ON assessment_sections(section_type);

CREATE INDEX idx_assessment_questions_type ON assessment_questions(assessment_type);
CREATE INDEX idx_assessment_questions_section ON assessment_questions(section_type);
CREATE INDEX idx_assessment_questions_active ON assessment_questions(is_active);

CREATE INDEX idx_assessment_responses_assessment ON assessment_responses(assessment_id);
CREATE INDEX idx_assessment_responses_question ON assessment_responses(question_id);
CREATE INDEX idx_assessment_responses_section ON assessment_responses(section_id);

CREATE INDEX idx_domain_scores_workspace ON domain_scores(workspace_id);
CREATE INDEX idx_domain_scores_user ON domain_scores(user_id);
CREATE INDEX idx_domain_scores_domain ON domain_scores(domain_number);
CREATE INDEX idx_domain_scores_assessed ON domain_scores(assessed_at);

CREATE INDEX idx_domain_score_history_domain ON domain_score_history(domain_score_id);
CREATE INDEX idx_domain_score_history_recorded ON domain_score_history(recorded_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps
CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_sections_updated_at
    BEFORE UPDATE ON assessment_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_questions_updated_at
    BEFORE UPDATE ON assessment_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_responses_updated_at
    BEFORE UPDATE ON assessment_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domain_scores_updated_at
    BEFORE UPDATE ON domain_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_templates_updated_at
    BEFORE UPDATE ON assessment_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update assessment progress when responses change
CREATE OR REPLACE FUNCTION update_assessment_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update answered count and progress percentage
    UPDATE assessments
    SET 
        answered_questions = (
            SELECT COUNT(*) FROM assessment_responses 
            WHERE assessment_id = NEW.assessment_id
        ),
        progress_percentage = (
            SELECT 
                CASE 
                    WHEN total_questions > 0 
                    THEN (COUNT(*) * 100 / total_questions)
                    ELSE 0 
                END
            FROM assessment_responses 
            WHERE assessment_id = NEW.assessment_id
        ),
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.assessment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessment_progress_on_response
    AFTER INSERT OR UPDATE ON assessment_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_assessment_progress();

-- ============================================
-- SEED DATA - Assessment Questions
-- ============================================

-- Quick Start Pulse Questions (15-20 questions across all three)
INSERT INTO assessment_questions (assessment_type, section_type, question_text, question_subtext, question_type, options, sort_order, tags) VALUES
-- Brain Section
('quick_pulse', 'brain_cognitive', 'How clear are you on your business vision for the next 12 months?', 'Think about your ability to articulate where your business is headed', 'scale', '{"min": 1, "max": 10, "step": 1, "labels": {"min_label": "Very unclear", "max_label": "Crystal clear"}}', 1, ARRAY['brain', 'vision', 'clarity']),
('quick_pulse', 'brain_patterns', 'When facing a business challenge, how do you typically respond?', NULL, 'single_choice', '[{"value": "analyze", "label": "Analyze data and make logical decisions", "score": 8}, {"value": "intuition", "label": "Trust my gut instinct", "score": 7}, {"value": "avoid", "label": "Avoid or delay decision-making", "score": 3}, {"value": "seek_help", "label": "Immediately seek external help", "score": 6}]', 2, ARRAY['brain', 'patterns', 'decision-making']),
('quick_pulse', 'brain_focus', 'How often do you experience decision fatigue in your business?', NULL, 'single_choice', '[{"value": "rarely", "label": "Rarely - I have clear systems", "score": 10}, {"value": "sometimes", "label": "Sometimes - around big decisions", "score": 7}, {"value": "often", "label": "Often - many decisions drain me", "score": 4}, {"value": "constantly", "label": "Constantly - I''m overwhelmed", "score": 2}]', 3, ARRAY['brain', 'focus', 'energy']),

-- Soul Section
('quick_pulse', 'soul_purpose', 'How aligned does your business feel with your personal values?', 'Consider whether your work feels meaningful and authentic', 'scale', '{"min": 1, "max": 10, "step": 1, "labels": {"min_label": "Completely misaligned", "max_label": "Deeply aligned"}}', 4, ARRAY['soul', 'purpose', 'values']),
('quick_pulse', 'soul_energy', 'How energized do you feel about your work most days?', NULL, 'single_choice', '[{"value": "very", "label": "Very energized and inspired", "score": 10}, {"value": "mostly", "label": "Mostly positive with some dips", "score": 8}, {"value": "neutral", "label": "Neutral - it''s just work", "score": 5}, {"value": "drained", "label": "Often drained or depleted", "score": 3}]', 5, ARRAY['soul', 'energy', 'fulfillment']),
('quick_pulse', 'soul_resilience', 'How well do you handle setbacks or failures in your business?', NULL, 'single_choice', '[{"value": "bounce_back", "label": "I bounce back quickly and learn", "score": 10}, {"value": "recover", "label": "I recover but it takes time", "score": 7}, {"value": "struggle", "label": "I struggle to move past them", "score": 4}, {"value": "paralyzed", "label": "They often paralyze me", "score": 2}]', 6, ARRAY['soul', 'resilience', 'mindset']),

-- Profit Architecture Section
('quick_pulse', 'profit_revenue', 'How predictable is your monthly revenue?', NULL, 'single_choice', '[{"value": "very", "label": "Very predictable - consistent income", "score": 10}, {"value": "mostly", "label": "Mostly predictable with some variation", "score": 8}, {"value": "unpredictable", "label": "Somewhat unpredictable", "score": 5}, {"value": "erratic", "label": "Highly erratic and stressful", "score": 2}]', 7, ARRAY['profit', 'revenue', 'predictability']),
('quick_pulse', 'profit_systems', 'How systematized are your core business processes?', 'Consider sales, marketing, delivery, and operations', 'scale', '{"min": 1, "max": 10, "step": 1, "labels": {"min_label": "Completely ad-hoc", "max_label": "Fully systematized"}}', 8, ARRAY['profit', 'systems', 'operations']),
('quick_pulse', 'profit_growth', 'What best describes your business growth trajectory?', NULL, 'single_choice', '[{"value": "accelerating", "label": "Accelerating with momentum", "score": 10}, {"value": "steady", "label": "Steady and sustainable", "score": 9}, {"value": "plateaued", "label": "Plateaued - need breakthrough", "score": 5}, {"value": "declining", "label": "Declining or struggling", "score": 2}]', 9, ARRAY['profit', 'growth', 'trajectory']),
('quick_pulse', 'profit_team', 'How would you describe your current team/ support structure?', NULL, 'single_choice', '[{"value": "strong", "label": "Strong team - I have great support", "score": 10}, {"value": "building", "label": "Building - some support in place", "score": 7}, {"value": "solo", "label": "Mostly solo with occasional help", "score": 5}, {"value": "overwhelmed", "label": "Overwhelmed - need more help", "score": 3}]', 10, ARRAY['profit', 'team', 'support']),

-- Integration Question
('quick_pulse', 'integration', 'Which area would have the biggest impact if improved?', 'Think about the one change that would transform your business', 'single_choice', '[{"value": "clarity", "label": "Strategic clarity and vision", "score": 0}, {"value": "mindset", "label": "Mindset and emotional resilience", "score": 0}, {"value": "systems", "label": "Systems and operations", "score": 0}, {"value": "revenue", "label": "Revenue and profitability", "score": 0}, {"value": "team", "label": "Team and delegation", "score": 0}]', 11, ARRAY['integration', 'priorities']);

-- Brain Assessment Questions (2 sections with branching)
INSERT INTO assessment_questions (assessment_type, section_type, question_text, question_subtext, question_type, options, sort_order, tags) VALUES
-- Section 1: Cognitive Patterns
('brain', 'cognitive_patterns', 'How do you prefer to process information when learning something new?', NULL, 'single_choice', '[{"value": "visual", "label": "Visual - diagrams, charts, images", "score": 8}, {"value": "auditory", "label": "Auditory - listening and discussing", "score": 8}, {"value": "kinesthetic", "label": "Kinesthetic - hands-on practice", "score": 8}, {"value": "reading", "label": "Reading - text and written instructions", "score": 8}]', 1, ARRAY['brain', 'cognitive', 'learning']),
('brain', 'cognitive_patterns', 'When planning a project, what is your natural tendency?', NULL, 'single_choice', '[{"value": "big_picture", "label": "Start with the big picture vision", "score": 8}, {"value": "details_first", "label": "Dive into the details and steps", "score": 8}, {"value": "deadline", "label": "Work backwards from the deadline", "score": 8}, {"value": "intuitive", "label": "Follow my intuition and adapt", "score": 8}]', 2, ARRAY['brain', 'planning', 'cognitive']),
('brain', 'cognitive_patterns', 'How do you handle multiple competing priorities?', NULL, 'single_choice', '[{"value": "prioritize", "label": "Systematically prioritize by impact", "score": 10}, {"value": "multitask", "label": "Try to work on several at once", "score": 5}, {"value": "sequential", "label": "Focus on one until it''s done", "score": 8}, {"value": "overwhelmed", "label": "Often feel overwhelmed", "score": 3}]', 3, ARRAY['brain', 'prioritization', 'focus']),
('brain', 'cognitive_patterns', 'What is your relationship with deadlines?', NULL, 'single_choice', '[{"value": "ahead", "label": "I usually finish ahead of time", "score": 10}, {"value": "comfortable", "label": "I work well with deadlines", "score": 8}, {"value": "pressure", "label": "I need deadline pressure to perform", "score": 6}, {"value": "miss", "label": "I often miss or extend deadlines", "score": 3}]', 4, ARRAY['brain', 'time', 'deadlines']),

-- Section 2: Strategic Thinking
('brain', 'strategic_thinking', 'How far ahead do you typically plan for your business?', NULL, 'single_choice', '[{"value": "5_year", "label": "5+ years with clear milestones", "score": 10}, {"value": "1_3_year", "label": "1-3 years with some flexibility", "score": 8}, {"value": "1_year", "label": "About 1 year ahead", "score": 6}, {"value": "quarterly", "label": "Quarterly or shorter-term", "score": 4}]', 5, ARRAY['brain', 'strategy', 'planning']),
('brain', 'strategic_thinking', 'How do you approach risk in your business decisions?', NULL, 'single_choice', '[{"value": "calculated", "label": "Calculated risks with mitigation plans", "score": 10}, {"value": "balanced", "label": "Balance risk and opportunity", "score": 8}, {"value": "cautious", "label": "Generally cautious and risk-averse", "score": 6}, {"value": "impulsive", "label": "Sometimes impulsive or overly cautious", "score": 4}]', 6, ARRAY['brain', 'risk', 'decision-making']);

-- Soul Assessment Questions (2 sections, optional sensitive questions)
INSERT INTO assessment_questions (assessment_type, section_type, question_text, question_subtext, question_type, options, sort_order, is_sensitive, tags) VALUES
-- Section 1: Purpose & Values
('soul', 'purpose_values', 'How connected do you feel to your business purpose?', NULL, 'scale', '{"min": 1, "max": 10, "step": 1, "labels": {"min_label": "Disconnected", "max_label": "Deeply connected"}}', 1, FALSE, ARRAY['soul', 'purpose', 'connection']),
('soul', 'purpose_values', 'Do your daily business activities align with your core values?', NULL, 'single_choice', '[{"value": "fully", "label": "Fully aligned - I live my values", "score": 10}, {"value": "mostly", "label": "Mostly aligned with some compromises", "score": 7}, {"value": "partially", "label": "Partially aligned - significant gaps", "score": 4}, {"value": "misaligned", "label": "Often misaligned - frequent conflict", "score": 2}]', 2, FALSE, ARRAY['soul', 'values', 'alignment']),
('soul', 'purpose_values', 'How often do you experience a sense of flow in your work?', 'Flow: being fully immersed and energized by what you''re doing', 'single_choice', '[{"value": "daily", "label": "Daily - it''s common for me", "score": 10}, {"value": "weekly", "label": "Weekly - several times a week", "score": 8}, {"value": "monthly", "label": "Monthly - occasionally", "score": 5}, {"value": "rarely", "label": "Rarely - almost never", "score": 2}]', 3, FALSE, ARRAY['soul', 'flow', 'engagement']),

-- Section 2: Emotional Resilience (with sensitive questions)
('soul', 'emotional_resilience', 'How do you typically handle criticism or negative feedback?', NULL, 'single_choice', '[{"value": "learn", "label": "See it as an opportunity to learn", "score": 10}, {"value": "process", "label": "Process it and then respond", "score": 8}, {"value": "defensive", "label": "Get defensive initially", "score": 5}, {"value": "affected", "label": "Take it personally and struggle", "score": 3}]', 4, FALSE, ARRAY['soul', 'feedback', 'resilience']),
('soul', 'emotional_resilience', 'How would you describe your current stress level?', NULL, 'single_choice', '[{"value": "low", "label": "Low - well managed", "score": 10}, {"value": "moderate", "label": "Moderate - manageable", "score": 7}, {"value": "high", "label": "High - affecting my wellbeing", "score": 4}, {"value": "severe", "label": "Severe - I need help", "score": 2}]', 5, TRUE, ARRAY['soul', 'stress', 'wellbeing']),
('soul', 'emotional_resilience', 'Have you experienced burnout in the past 12 months?', NULL, 'single_choice', '[{"value": "no", "label": "No - I''ve maintained good balance", "score": 10}, {"value": "close", "label": "Came close but prevented it", "score": 7}, {"value": "mild", "label": "Yes, mild burnout", "score": 4}, {"value": "significant", "label": "Yes, significant burnout", "score": 2}]', 6, TRUE, ARRAY['soul', 'burnout', 'health']),
('soul', 'emotional_resilience', 'How supported do you feel in your business journey?', NULL, 'scale', '{"min": 1, "max": 10, "step": 1, "labels": {"min_label": "Isolated", "max_label": "Deeply supported"}}', 7, FALSE, ARRAY['soul', 'support', 'community']);

-- Profit Architecture Questions (3-5 questions per domain)
INSERT INTO assessment_questions (assessment_type, section_type, question_text, question_subtext, question_type, options, sort_order, tags) VALUES
-- Revenue Model Domain
('profit_architecture', 'revenue_model', 'How diversified are your revenue streams?', NULL, 'single_choice', '[{"value": "highly", "label": "Highly diversified - 4+ streams", "score": 10}, {"value": "moderately", "label": "Moderately - 2-3 streams", "score": 8}, {"value": "limited", "label": "Limited - mainly one stream", "score": 5}, {"value": "single", "label": "Single source - vulnerable", "score": 2}]', 1, ARRAY['profit', 'revenue', 'diversification']),
('profit_architecture', 'revenue_model', 'What percentage of your revenue is recurring or predictable?', NULL, 'single_choice', '[{"value": "80_plus", "label": "80% or more", "score": 10}, {"value": "50_80", "label": "50-80%", "score": 8}, {"value": "20_50", "label": "20-50%", "score": 5}, {"value": "under_20", "label": "Under 20%", "score": 2}]', 2, ARRAY['profit', 'revenue', 'recurring']),
('profit_architecture', 'revenue_model', 'How would you rate your pricing strategy?', NULL, 'single_choice', '[{"value": "optimal", "label": "Optimal - reflects true value", "score": 10}, {"value": "good", "label": "Good - fairly priced", "score": 8}, {"value": "low", "label": "Probably underpriced", "score": 5}, {"value": "unsure", "label": "Unsure - no clear strategy", "score": 3}]', 3, ARRAY['profit', 'pricing', 'strategy']),

-- Operations Domain
('profit_architecture', 'operations', 'How documented are your core business processes?', NULL, 'single_choice', '[{"value": "fully", "label": "Fully documented and up-to-date", "score": 10}, {"value": "mostly", "label": "Mostly documented", "score": 7}, {"value": "partially", "label": "Partially documented", "score": 4}, {"value": "minimal", "label": "Minimal or no documentation", "score": 2}]', 4, ARRAY['profit', 'operations', 'documentation']),
('profit_architecture', 'operations', 'How much of your business is automated?', NULL, 'single_choice', '[{"value": "highly", "label": "Highly automated - minimal manual work", "score": 10}, {"value": "moderately", "label": "Moderately automated", "score": 7}, {"value": "minimally", "label": "Minimally automated", "score": 4}, {"value": "manual", "label": "Mostly manual processes", "score": 2}]', 5, ARRAY['profit', 'operations', 'automation']),

-- Marketing Domain
('profit_architecture', 'marketing', 'How consistent is your marketing presence?', NULL, 'single_choice', '[{"value": "very", "label": "Very consistent - strong presence", "score": 10}, {"value": "mostly", "label": "Mostly consistent with some gaps", "score": 7}, {"value": "inconsistent", "label": "Inconsistent - sporadic efforts", "score": 4}, {"value": "minimal", "label": "Minimal marketing activity", "score": 2}]', 6, ARRAY['profit', 'marketing', 'consistency']),
('profit_architecture', 'marketing', 'How effective is your lead generation?', NULL, 'single_choice', '[{"value": "strong", "label": "Strong - consistent quality leads", "score": 10}, {"value": "good", "label": "Good - steady flow", "score": 8}, {"value": "inconsistent", "label": "Inconsistent - feast or famine", "score": 5}, {"value": "weak", "label": "Weak - struggling to generate", "score": 2}]', 7, ARRAY['profit', 'marketing', 'leads']),

-- Sales Domain
('profit_architecture', 'sales', 'How structured is your sales process?', NULL, 'single_choice', '[{"value": "fully", "label": "Fully structured with clear stages", "score": 10}, {"value": "mostly", "label": "Mostly structured", "score": 8}, {"value": "somewhat", "label": "Somew