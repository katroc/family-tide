-- Stage 2.2: Row Level Security (RLS) Policies - Read-Only
-- Enable RLS and create read-only policies for family data isolation

-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_routine_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_app_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's family IDs
CREATE OR REPLACE FUNCTION get_user_family_ids()
RETURNS UUID[] AS $$
BEGIN
  RETURN (
    SELECT ARRAY_AGG(family_id)
    FROM family_memberships
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user belongs to a family
CREATE OR REPLACE FUNCTION user_belongs_to_family(family_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM family_memberships 
    WHERE user_id = auth.uid() 
    AND family_id = family_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- READ-ONLY POLICIES

-- 1. FAMILIES - Users can read families they belong to
CREATE POLICY "Users can read their families" ON families
  FOR SELECT
  TO authenticated
  USING (id = ANY(get_user_family_ids()));

-- 2. FAMILY MEMBERSHIPS - Users can read their own memberships
CREATE POLICY "Users can read their memberships" ON family_memberships
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. FAMILY MEMBERS - Users can read members from their families
CREATE POLICY "Users can read family members" ON family_members
  FOR SELECT
  TO authenticated
  USING (family_id = ANY(get_user_family_ids()));

-- 4. CHORE TYPES - Users can read chore types from their families
CREATE POLICY "Users can read chore types" ON chore_types
  FOR SELECT
  TO authenticated
  USING (family_id = ANY(get_user_family_ids()));

-- 5. CHORES - Users can read chores from their families
CREATE POLICY "Users can read chores" ON chores
  FOR SELECT
  TO authenticated
  USING (family_id = ANY(get_user_family_ids()));

-- 6. EVENTS - Users can read events from their families
CREATE POLICY "Users can read events" ON events
  FOR SELECT
  TO authenticated
  USING (family_id = ANY(get_user_family_ids()));

-- 7. REWARDS - Users can read rewards from their families
CREATE POLICY "Users can read rewards" ON rewards
  FOR SELECT
  TO authenticated
  USING (family_id = ANY(get_user_family_ids()));

-- 8. ROUTINES - Users can read routines from their families
CREATE POLICY "Users can read routines" ON routines
  FOR SELECT
  TO authenticated
  USING (family_id = ANY(get_user_family_ids()));

-- 9. DAILY ROUTINE PROGRESS - Users can read progress from their families
CREATE POLICY "Users can read routine progress" ON daily_routine_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.id = daily_routine_progress.member_id
      AND fm.family_id = ANY(get_user_family_ids())
    )
  );

-- 10. USER APP SETTINGS - Users can read their own settings
CREATE POLICY "Users can read their settings" ON user_app_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ADDITIONAL SECURITY SETTINGS

-- Allow anonymous users to check if Supabase is working (for our health check)
CREATE POLICY "Allow anonymous health check" ON pg_tables
  FOR SELECT
  TO anon
  USING (schemaname = 'information_schema');

-- Ensure auth.users table has proper policies (if needed)
-- Note: auth.users typically has built-in RLS policies

-- GRANT necessary permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- GRANT execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_family_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION user_belongs_to_family(UUID) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION get_user_family_ids() IS 'Returns array of family IDs that the current user belongs to';
COMMENT ON FUNCTION user_belongs_to_family(UUID) IS 'Checks if current user belongs to specified family';

-- Verification queries (commented out for production)
-- SELECT 'RLS enabled successfully for all tables' as status;
