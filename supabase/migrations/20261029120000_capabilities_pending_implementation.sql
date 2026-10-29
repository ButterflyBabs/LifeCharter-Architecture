-- Accounts made from /new-clients (Pre-Founders, comped VIPs) carry their plan on
-- profiles.current_plan_id with subscription_status = 'pending_implementation' and
-- have no subscriptions row until a Stripe subscription exists. get_user_capabilities
-- only looked at subscriptions, so those accounts were treated as the free tier
-- (0 AI actions) and saw Upgrade buttons. Fall back to the profile's plan for them.
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
        SELECT current_plan_id INTO v_plan_id
        FROM profiles
        WHERE id = p_user_id
        AND subscription_status = 'pending_implementation';
    END IF;

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
