-- Add subscriptions and plan capabilities tables

-- Plan definitions
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly INTEGER NOT NULL, -- in cents
    price_yearly INTEGER, -- in cents
    onboarding_fee INTEGER, -- in cents
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    capabilities JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES plans(id),
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'incomplete', -- incomplete, active, past_due, canceled, paused
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    onboarding_paid BOOLEAN DEFAULT false,
    onboarding_fee INTEGER, -- in cents
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capability usage tracking
CREATE TABLE IF NOT EXISTS capability_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    capability_type TEXT NOT NULL, -- 'ai_actions', 'automations', 'seats', 'workspaces'
    usage_count INTEGER DEFAULT 0,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, capability_type, period_start)
);

-- Insert the three plans
INSERT INTO plans (id, name, description, price_monthly, onboarding_fee, capabilities) VALUES
('starter', 'Starter', 'For a single coach running one business', 29700, 199700, '{
    "seats": 1,
    "workspaces": 1,
    "ai_actions_per_month": 50,
    "automations": 2,
    "modules": ["command_center", "business_architecture", "revenue_engine", "client_experience"],
    "features": ["guided_onboarding"]
}'),
('growth', 'Growth', 'For a small delivery team across a few brands', 49700, 249700, '{
    "seats": 5,
    "workspaces": 3,
    "ai_actions_per_month": 500,
    "automations": 10,
    "modules": ["command_center", "business_architecture", "revenue_engine", "client_experience", "operations", "review_center", "ai_team"],
    "features": ["guided_onboarding", "branded_portal", "multi_brand_scoping"]
}'),
('vip', 'VIP / Done-With-You', 'Platform plus hands-on implementation support', 99700, 0, '{
    "seats": -1,
    "workspaces": -1,
    "ai_actions_per_month": -1,
    "automations": -1,
    "modules": ["command_center", "business_architecture", "revenue_engine", "client_experience", "operations", "review_center", "ai_team"],
    "features": ["custom_onboarding", "white_label", "custom_ai_agents", "dedicated_support"]
}')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    onboarding_fee = EXCLUDED.onboarding_fee,
    capabilities = EXCLUDED.capabilities;

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE capability_usage ENABLE ROW LEVEL SECURITY;

-- Plans are readable by all
CREATE POLICY "Plans are viewable by everyone" ON plans
    FOR SELECT USING (true);

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own capability usage
CREATE POLICY "Users can view own capability usage" ON capability_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Function to get user's current plan capabilities
CREATE OR REPLACE FUNCTION get_user_capabilities(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_capabilities JSONB;
    v_plan_id TEXT;
BEGIN
    SELECT plan_id INTO v_plan_id
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_plan_id IS NULL THEN
        -- Return free tier capabilities
        RETURN '{
            "seats": 0,
            "workspaces": 0,
            "ai_actions_per_month": 0,
            "automations": 0,
            "modules": [],
            "features": []
        }'::JSONB;
    END IF;
    
    SELECT capabilities INTO v_capabilities
    FROM plans
    WHERE id = v_plan_id;
    
    RETURN v_capabilities;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has capability
CREATE OR REPLACE FUNCTION check_capability(p_user_id UUID, p_capability TEXT, p_amount INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    v_capabilities JSONB;
    v_limit INTEGER;
    v_current_usage INTEGER;
BEGIN
    v_capabilities := get_user_capabilities(p_user_id);
    
    -- Get the limit for this capability
    v_limit := (v_capabilities->p_capability)::INTEGER;
    
    -- -1 means unlimited
    IF v_limit = -1 THEN
        RETURN true;
    END IF;
    
    -- Get current usage for this period
    SELECT COALESCE(SUM(usage_count), 0) INTO v_current_usage
    FROM capability_usage
    WHERE user_id = p_user_id
    AND capability_type = p_capability
    AND period_start <= NOW()
    AND period_end >= NOW();
    
    RETURN (v_current_usage + p_amount) <= v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment capability usage
CREATE OR REPLACE FUNCTION increment_capability_usage(p_user_id UUID, p_capability TEXT, p_amount INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
BEGIN
    -- Calculate period (monthly)
    v_period_start := DATE_TRUNC('month', NOW());
    v_period_end := v_period_start + INTERVAL '1 month';
    
    -- Check if user has capability first
    IF NOT check_capability(p_user_id, p_capability, p_amount) THEN
        RETURN false;
    END IF;
    
    -- Insert or update usage
    INSERT INTO capability_usage (user_id, capability_type, usage_count, period_start, period_end)
    VALUES (p_user_id, p_capability, p_amount, v_period_start, v_period_end)
    ON CONFLICT (user_id, capability_type, period_start)
    DO UPDATE SET 
        usage_count = capability_usage.usage_count + p_amount,
        updated_at = NOW();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add subscription status to profiles for easy access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_plan_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

COMMENT ON TABLE plans IS 'Available subscription plans with capabilities';
COMMENT ON TABLE subscriptions IS 'User subscriptions to plans';
COMMENT ON TABLE capability_usage IS 'Tracks usage of plan-limited features';
