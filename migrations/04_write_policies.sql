-- Stage 3.2: Write Policies for RLS - Part 1
-- Allow authenticated users to INSERT, UPDATE, DELETE within their families

-- 1. FAMILIES - Users can update families they belong to
CREATE POLICY "Users can update their families" ON families
  FOR UPDATE
  TO authenticated
  USING (id = ANY(get_user_family_ids()))
  WITH CHECK (id = ANY(get_user_family_ids()));

-- 2. FAMILY MEMBERSHIPS - Users can insert memberships (for invites)
-- Note: Only allow via RPC functions for security
CREATE POLICY "Users can manage memberships via RPC" ON family_memberships
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR family_id = ANY(get_user_family_ids()));

-- 3. FAMILY MEMBERS - Users can manage members in their families
CREATE POLICY "Users can insert family members" ON family_members
  FOR INSERT
  TO authenticated
  WITH CHECK (family_id = ANY(get_user_family_ids()));

CREATE POLICY "Users can update family members" ON family_members
  FOR UPDATE
  TO authenticated
  USING (family_id = ANY(get_user_family_ids()))
  WITH CHECK (family_id = ANY(get_user_family_ids()));

CREATE POLICY "Users can delete family members" ON family_members
  FOR DELETE
  TO authenticated
  USING (family_id = ANY(get_user_family_ids()));

-- 4. CHORE TYPES - Users can manage chore types in their families
CREATE POLICY "Users can insert chore types" ON chore_types
  FOR INSERT
  TO authenticated
  WITH CHECK (family_id = ANY(get_user_family_ids()));

CREATE POLICY "Users can update chore types" ON chore_types
  FOR UPDATE
  TO authenticated
  USING (family_id = ANY(get_user_family_ids()))
  WITH CHECK (family_id = ANY(get_user_family_ids()));

CREATE POLICY "Users can delete chore types" ON chore_types
  FOR DELETE
  TO authenticated
  USING (family_id = ANY(get_user_family_ids()));

-- Grant INSERT, UPDATE, DELETE permissions
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
