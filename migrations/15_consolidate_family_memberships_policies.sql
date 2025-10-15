-- Consolidate family_memberships RLS policies to eliminate redundancy
-- The "Users can manage memberships via RPC" (FOR ALL) policy already covers SELECT operations
-- and has more permissive conditions, making the SELECT-only policy redundant

-- Drop the redundant SELECT-only policy
DROP POLICY IF EXISTS "Users can read their memberships" ON family_memberships;

-- Keep the comprehensive ALL policy which covers all operations (SELECT, INSERT, UPDATE, DELETE)
-- Policy "Users can manage memberships via RPC" FOR ALL remains:
-- USING (user_id = (SELECT auth.uid()) OR family_id = ANY(get_user_family_ids()))

-- Comments
COMMENT ON POLICY "Users can manage memberships via RPC" ON family_memberships IS
'Consolidated policy covering all operations (SELECT, INSERT, UPDATE, DELETE). Allows users to manage their own memberships or memberships in families they belong to. Optimized with SELECT wrapper on auth.uid().';
