-- Add remaining foreign key indexes for complete coverage
-- These improve JOIN performance on frequently accessed relationships

-- Add index on chores.assigned_to_id (references family_members.id)
CREATE INDEX IF NOT EXISTS idx_chores_assigned_to_id_fk
ON chores(assigned_to_id);

-- Add index on family_members.user_id (references auth.users.id)
CREATE INDEX IF NOT EXISTS idx_family_members_user_id_fk
ON family_members(user_id);

-- Comments
COMMENT ON INDEX idx_chores_assigned_to_id_fk IS 'Foreign key index for chores -> family_members relationship';
COMMENT ON INDEX idx_family_members_user_id_fk IS 'Foreign key index for family_members -> auth.users relationship';
