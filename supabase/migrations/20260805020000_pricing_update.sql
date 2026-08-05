-- Pricing update to the locked three-tier structure (Aug 2026 Positioning Brief).
-- onboarding_fee = one-time implementation; price_monthly = monthly; price_yearly
-- = pay-in-full (all-in first year, includes implementation). All amounts in cents.
-- Every tier includes the full core Command Suite (nothing locked); tiers scale on
-- coaching depth + usage limits (workspaces / AI tier / seats / 1:1s).
update public.plans set onboarding_fee=249700, price_monthly=34700, price_yearly=500000,
  capabilities = capabilities || '{"modules":["command_center","business_architecture","revenue_engine","client_experience","operations","review_center"],"workspaces":1,"businesses":1,"ai_tier":"standard","seats":1,"coaching_1on1_per_month":0}'::jsonb
  where id='starter';

update public.plans set onboarding_fee=299700, price_monthly=49700, price_yearly=700000,
  capabilities = capabilities || '{"modules":["command_center","business_architecture","revenue_engine","client_experience","operations","review_center"],"workspaces":3,"businesses":3,"ai_tier":"expanded","seats":2,"coaching_1on1_per_month":1}'::jsonb
  where id='growth';

update public.plans set name='VIP', onboarding_fee=499700, price_monthly=99700, price_yearly=1350000,
  capabilities = capabilities || '{"modules":["command_center","business_architecture","revenue_engine","client_experience","operations","review_center","ai_team"],"workspaces":-1,"businesses":-1,"ai_tier":"priority","seats":-1,"coaching_1on1_per_month":2,"early_access":true}'::jsonb
  where id='vip';
