-- Combine multiple permissive RLS policies into single policies
-- Multiple permissive policies require PostgreSQL to evaluate each one, which is slower
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

-- 1. Combine families SELECT policies
-- Original policies:
--   - "Users can read their families" - id = ANY(get_user_family_ids())
--   - "Users can lookup families by invite code" - invite_code IS NOT NULL AND invite_code != ''
-- Combined into single policy with OR condition

DROP POLICY IF EXISTS "Users can read their families" ON families;
DROP POLICY IF EXISTS "Users can lookup families by invite code" ON families;

CREATE POLICY "Users can read families" ON families
  FOR SELECT
  TO authenticated
  USING (
    -- User belongs to this family
    id = ANY(get_user_family_ids())
    OR
    -- Family has a valid invite code (for joining)
    (invite_code IS NOT NULL AND invite_code != '')
  );

-- 2. Note: family_memberships policies were already optimized in migration 11
-- The two policies there serve different purposes:
--   - "Users can read their memberships" (SELECT only)
--   - "Users can manage memberships via RPC" (ALL operations)
-- These cannot be combined as they have different operation types (SELECT vs ALL)

-- Comments
COMMENT ON POLICY "Users can read families" ON families IS
'Combined policy: allows users to read families they belong to OR families with valid invite codes. Optimized for performance.';
