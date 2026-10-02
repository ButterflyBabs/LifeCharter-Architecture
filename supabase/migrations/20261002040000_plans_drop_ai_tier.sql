-- The plan "AI level" (standard / expanded / priority) was stored but never used
-- or shown; clients bring their own AI key. Removed at Babs's request (2026-10-02).
update public.plans set capabilities = capabilities - 'ai_tier' where capabilities ? 'ai_tier';
