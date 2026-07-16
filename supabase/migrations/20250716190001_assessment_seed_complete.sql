-- Complete Assessment Seed Data
-- Additional questions for Profit Architecture and templates

INSERT INTO assessment_questions (assessment_type, section_type, question_text, question_subtext, question_type, options, sort_order, tags) VALUES
('profit_architecture', 'sales', 'What is your current conversion rate from lead to customer?', NULL, 'single_choice', '[{"value": "high", "label": "20% or higher", "score": 10}, {"value": "good", "label": "10-20%", "score": 8}, {"value": "average", "label": "5-10%", "score": 5}, {"value": "low", "label": "Under 5%", "score": 2}]', 8, ARRAY['profit', 'sales', 'conversion']),
('profit_architecture', 'sales', 'How confident are you in your sales conversations?', NULL, 'scale', '{"min": 1, "max": 10, "step": 1, "labels": {"min_label": "Not confident", "max_label": "Very confident"}}', 9, ARRAY['profit', 'sales', 'confidence']),

-- Finance Domain
('profit_architecture', 'finance', 'How well do you understand your business finances?', NULL, 'single_choice', '[{"value": "expert", "label": "Expert - I review and understand all metrics", "score": 10}, {"value": "good", "label": "Good - I understand key numbers", "score": 8}, {"value": "basic", "label": "Basic - I know revenue and expenses", "score": 5}, {"value": "limited", "label": "Limited - I avoid looking at finances", "score": 2}]', 10, ARRAY['profit', 'finance', 'literacy']),
('profit_architecture', 'finance', 'How predictable are your cash flows?', NULL, 'single_choice', '[{"value": "very", "label": "Very predictable - I can forecast accurately", "score": 10}, {"value": "mostly", "label": "Mostly predictable", "score": 7}, {"value": "somewhat", "label": "Somewhat unpredictable", "score": 4}, {"value": "unpredictable", "label": "Very unpredictable - constant stress", "score": 2}]', 11, ARRAY['profit', 'finance', 'cashflow']),
('profit_architecture', 'finance', 'What is your current profit margin?', NULL, 'single_choice', '[{"value": "40_plus", "label": "40% or higher", "score": 10}, {"value": "25_40", "label": "25-40%", "score": 8}, {"value": "15_25", "label": "15-25%", "score": 6}, {"value": "under_15", "label": "Under 15%", "score": 3}]', 12, ARRAY['profit', 'finance', 'margin']),

-- Team Domain
('profit_architecture', 'team', 'How would you rate your current team structure?', NULL, 'single_choice', '[{"value": "optimal", "label": "Optimal - right people in right roles", "score": 10}, {"value": "good", "label": "Good - mostly effective", "score": 8}, {"value": "gaps", "label": "Some gaps but functional", "score": 5}, {"value": "understaffed", "label": "Significantly understaffed", "score": 2}]', 13, ARRAY['profit', 'team', 'structure']),
('profit_architecture', 'team', 'How effective is your delegation?', NULL, 'single_choice', '[{"value": "excellent", "label": "Excellent - I delegate effectively", "score": 10}, {"value": "good", "label": "Good - delegate most tasks appropriately", "score": 8}, {"value": "limited", "label": "Limited - struggle to let go", "score": 5}, {"value": "none", "label": "Minimal - I do most things myself", "score": 2}]', 14, ARRAY['profit', 'team', 'delegation']),

-- Customer Experience Domain
('profit_architecture', 'customer_experience', 'How would you rate your customer retention?', NULL, 'single_choice', '[{"value": "excellent", "label": "Excellent - high retention and loyalty", "score": 10}, {"value": "good", "label": "Good - solid retention rates", "score": 8}, {"value": "average", "label": "Average - some churn", "score": 5}, {"value": "poor", "label": "Poor - high churn rates", "score": 2}]', 15, ARRAY['profit', 'customer', 'retention']),
('profit_architecture', 'customer_experience', 'How systematized is your customer onboarding?', NULL, 'single_choice', '[{"value": "fully", "label": "Fully systematized - seamless experience", "score": 10}, {"value": "mostly", "label": "Mostly systematized", "score": 7}, {"value": "partially", "label": "Partially systematized", "score": 4}, {"value": "ad_hoc", "label": "Ad-hoc - inconsistent", "score": 2}]', 16, ARRAY['profit', 'customer', 'onboarding']);

-- Create assessment templates
INSERT INTO assessment_templates (name, description, assessment_type, config, sections, is_default) VALUES
(
    'Quick Start Pulse',
    'A 15-20 question assessment across Brain, Soul, and Profit Architecture to quickly identify your business alignment.',
    'quick_pulse',
    '{
        "estimated_duration": 10,
        "allow_pause": true,
        "show_progress": true,
        "auto_save": true,
        "scoring_method": "weighted_average"
    }',
    '[
        {
            "name": "brain_section",
            "title": "Brain Architecture",
            "description": "Your cognitive patterns and strategic thinking",
            "question_count": 3
        },
        {
            "name": "soul_section",
            "title": "Soul Architecture", 
            "description": "Your purpose, values, and emotional resilience",
            "question_count": 3
        },
        {
            "name": "profit_section",
            "title": "Profit Architecture",
            "description": "Your business systems and financial health",
            "question_count": 4
        },
        {
            "name": "integration",
            "title": "Integration",
            "description": "Bringing it all together",
            "question_count": 1
        }
    ]',
    TRUE
),
(
    'Brain Architecture Deep Dive',
    'A comprehensive assessment of your cognitive patterns, strategic thinking, and mental models.',
    'brain',
    '{
        "estimated_duration": 15,
        "allow_pause": true,
        "show_progress": true,
        "auto_save": true,
        "scoring_method": "section_average"
    }',
    '[
        {
            "name": "cognitive_patterns",
            "title": "Cognitive Patterns",
            "description": "How you process information and make decisions",
            "question_count": 4
        },
        {
            "name": "strategic_thinking",
            "title": "Strategic Thinking",
            "description": "Your approach to planning and risk",
            "question_count": 2
        }
    ]',
    FALSE
),
(
    'Soul Architecture Deep Dive',
    'Explore your purpose alignment, values, and emotional resilience in business.',
    'soul',
    '{
        "estimated_duration": 15,
        "allow_pause": true,
        "show_progress": true,
        "auto_save": true,
        "show_sensitive_warning": true,
        "scoring_method": "section_average"
    }',
    '[
        {
            "name": "purpose_values",
            "title": "Purpose & Values",
            "description": "Your connection to meaning and alignment",
            "question_count": 3
        },
        {
            "name": "emotional_resilience",
            "title": "Emotional Resilience",
            "description": "How you handle stress, feedback, and setbacks",
            "question_count": 4,
            "has_sensitive_questions": true
        }
    ]',
    FALSE
),
(
    'Profit Architecture Assessment',
    'Evaluate your business systems across 6 key domains: Revenue, Operations, Marketing, Sales, Finance, and Team.',
    'profit_architecture',
    '{
        "estimated_duration": 20,
        "allow_pause": true,
        "show_progress": true,
        "auto_save": true,
        "scoring_method": "domain_average"
    }',
    '[
        {
            "name": "revenue_model",
            "title": "Revenue Model",
            "description": "Diversification, predictability, and pricing",
            "question_count": 3
        },
        {
            "name": "operations",
            "title": "Operations",
            "description": "Documentation and automation",
            "question_count": 2
        },
        {
            "name": "marketing",
            "title": "Marketing",
            "description": "Consistency and lead generation",
            "question_count": 2
        },
        {
            "name": "sales",
            "title": "Sales",
            "description": "Process, conversion, and confidence",
            "question_count": 3
        },
        {
            "name": "finance",
            "title": "Finance",
            "description": "Understanding, cash flow, and margins",
            "question_count": 3
        },
        {
            "name": "team",
            "title": "Team & Delegation",
            "description": "Structure and effectiveness",
            "question_count": 2
        },
        {
            "name": "customer_experience",
            "title": "Customer Experience",
            "description": "Retention and onboarding",
            "question_count": 2
        }
    ]',
    FALSE
);
