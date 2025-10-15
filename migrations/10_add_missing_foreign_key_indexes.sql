-- Add missing foreign key indexes for improved JOIN performance
-- These indexes will significantly improve query performance for foreign key lookups
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

-- Add index on chores.chore_type_id
-- This improves performance when filtering chores by type
CREATE INDEX IF NOT EXISTS idx_chores_chore_type_id
ON chores(chore_type_id);

-- Add index on daily_routine_progress.routine_id
-- This improves performance when querying routine progress data
CREATE INDEX IF NOT EXISTS idx_daily_routine_progress_routine_id
ON daily_routine_progress(routine_id);

-- Comments
COMMENT ON INDEX idx_chores_chore_type_id IS 'Foreign key index for improved JOIN performance on chore_type_id';
COMMENT ON INDEX idx_daily_routine_progress_routine_id IS 'Foreign key index for improved JOIN performance on routine_id';
