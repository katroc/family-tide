-- Fix RLS policies that cause initplan issues (performance problem)
-- Wrap auth.uid() calls in SELECT to prevent re-evaluation for each row
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- 1. Fix family_memberships "Users can read their memberships" policy
DROP POLICY IF EXISTS "Users can read their memberships" ON family_memberships;
CREATE POLICY "Users can read their memberships" ON family_memberships
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 2. Fix family_memberships "Users can manage memberships via RPC" policy
DROP POLICY IF EXISTS "Users can manage memberships via RPC" ON family_memberships;
CREATE POLICY "Users can manage memberships via RPC" ON family_memberships
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR family_id = ANY(get_user_family_ids()));

-- 3. Fix user_app_settings "Users can read their settings" policy
DROP POLICY IF EXISTS "Users can read their settings" ON user_app_settings;
CREATE POLICY "Users can read their settings" ON user_app_settings
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Comments
COMMENT ON POLICY "Users can read their memberships" ON family_memberships IS 'Optimized policy - auth.uid() wrapped in SELECT to prevent initplan';
COMMENT ON POLICY "Users can manage memberships via RPC" ON family_memberships IS 'Optimized policy - auth.uid() wrapped in SELECT to prevent initplan';
COMMENT ON POLICY "Users can read their settings" ON user_app_settings IS 'Optimized policy - auth.uid() wrapped in SELECT to prevent initplan';
