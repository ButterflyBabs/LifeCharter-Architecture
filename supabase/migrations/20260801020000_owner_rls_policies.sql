-- Owner row-level-security policies (defense in depth).
--
-- Primary per-client isolation is enforced at the APPLICATION layer: every data
-- route resolves the signed-in user's own master_plan_id (resolveMasterPlanId)
-- and scopes its queries to it, using the service role (which bypasses RLS).
--
-- These policies add a second line of defense for any DIRECT authenticated DB
-- access (e.g. the browser Supabase client): an authenticated user may only see
-- and write rows that belong to their own master plan. Anonymous access stays
-- denied (no anon policy), and the service role continues to bypass RLS, so the
-- app's server routes are unaffected and nothing that works today breaks.

-- Master plan: the owner is the user_id on the row.
DROP POLICY IF EXISTS mp_owner ON client_master_plans;
CREATE POLICY mp_owner ON client_master_plans FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Tables that carry master_plan_id: owner is the master plan's user_id.
DROP POLICY IF EXISTS ucr_owner ON unified_client_responses;
CREATE POLICY ucr_owner ON unified_client_responses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM client_master_plans mp WHERE mp.id = unified_client_responses.master_plan_id AND mp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM client_master_plans mp WHERE mp.id = unified_client_responses.master_plan_id AND mp.user_id = auth.uid()));

DROP POLICY IF EXISTS cai_owner ON client_action_items;
CREATE POLICY cai_owner ON client_action_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM client_master_plans mp WHERE mp.id = client_action_items.master_plan_id AND mp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM client_master_plans mp WHERE mp.id = client_action_items.master_plan_id AND mp.user_id = auth.uid()));

DROP POLICY IF EXISTS ci_owner ON client_insights;
CREATE POLICY ci_owner ON client_insights FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM client_master_plans mp WHERE mp.id = client_insights.master_plan_id AND mp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM client_master_plans mp WHERE mp.id = client_insights.master_plan_id AND mp.user_id = auth.uid()));

DROP POLICY IF EXISTS qpc_owner ON quick_pulse_checkins;
CREATE POLICY qpc_owner ON quick_pulse_checkins FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM client_master_plans mp WHERE mp.id = quick_pulse_checkins.master_plan_id AND mp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM client_master_plans mp WHERE mp.id = quick_pulse_checkins.master_plan_id AND mp.user_id = auth.uid()));

DROP POLICY IF EXISTS cp_owner ON client_plans;
CREATE POLICY cp_owner ON client_plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM client_master_plans mp WHERE mp.id = client_plans.master_plan_id AND mp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM client_master_plans mp WHERE mp.id = client_plans.master_plan_id AND mp.user_id = auth.uid()));

DROP POLICY IF EXISTS css_owner ON client_score_snapshots;
CREATE POLICY css_owner ON client_score_snapshots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM client_master_plans mp WHERE mp.id = client_score_snapshots.master_plan_id AND mp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM client_master_plans mp WHERE mp.id = client_score_snapshots.master_plan_id AND mp.user_id = auth.uid()));

-- Plan goals: owner via the parent plan's master plan.
DROP POLICY IF EXISTS cpg_owner ON client_plan_goals;
CREATE POLICY cpg_owner ON client_plan_goals FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM client_plans p
    JOIN client_master_plans mp ON mp.id = p.master_plan_id
    WHERE p.id = client_plan_goals.plan_id AND mp.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM client_plans p
    JOIN client_master_plans mp ON mp.id = p.master_plan_id
    WHERE p.id = client_plan_goals.plan_id AND mp.user_id = auth.uid()
  ));
