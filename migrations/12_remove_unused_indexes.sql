-- Remove unused indexes to improve write performance and save storage space
-- These indexes have never been used and slow down INSERT/UPDATE/DELETE operations
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

-- Note: Keep the new indexes we just created (idx_chores_chore_type_id, idx_daily_routine_progress_routine_id)

-- Family memberships indexes
DROP INDEX IF EXISTS idx_family_memberships_user_id;

-- Family members indexes
DROP INDEX IF EXISTS idx_family_members_family_id;
DROP INDEX IF EXISTS idx_family_members_user_id;
DROP INDEX IF EXISTS idx_family_members_search;

-- Chores indexes
DROP INDEX IF EXISTS idx_chores_family_id;
DROP INDEX IF EXISTS idx_chores_assigned_to_id;
DROP INDEX IF EXISTS idx_chores_due_date;
DROP INDEX IF EXISTS idx_chores_family_status;
DROP INDEX IF EXISTS idx_chores_assigned_member;
DROP INDEX IF EXISTS idx_chores_active_family;
DROP INDEX IF EXISTS idx_chores_search;

-- Daily routine progress indexes
DROP INDEX IF EXISTS idx_daily_routine_progress_member_id;
DROP INDEX IF EXISTS idx_routine_progress_member_date;
DROP INDEX IF EXISTS idx_routine_progress_recent;

-- Rewards indexes
DROP INDEX IF EXISTS idx_rewards_family_available;

-- Routines indexes
DROP INDEX IF EXISTS idx_routines_family_members;

-- Families indexes
DROP INDEX IF EXISTS idx_families_invite_lookup;

-- Events indexes
DROP INDEX IF EXISTS idx_events_search;
DROP INDEX IF EXISTS idx_events_date;

-- Summary: Removed 19 unused indexes
-- This will:
-- 1. Improve write performance (INSERT/UPDATE/DELETE faster)
-- 2. Reduce storage space (saves ~2-5MB per 10k rows depending on usage)
-- 3. Simplify query planning (fewer index options for optimizer to consider)
