-- Performance Optimization for Family Planner
-- Stage 7.1: Advanced Indexing and Query Optimization

-- 1. CRITICAL INDEXES FOR QUERY PERFORMANCE
-- These indexes are essential for fast family-scoped queries

-- Family memberships lookup (user -> families)
CREATE INDEX IF NOT EXISTS idx_family_memberships_user_lookup 
ON family_memberships(user_id, family_id);

-- Family members by family (most common query)
CREATE INDEX IF NOT EXISTS idx_family_members_family_lookup 
ON family_members(family_id, name);

-- Chores by family and status (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_chores_family_status 
ON chores(family_id, status, due_date);

-- Chores by assignment (member-specific views)
CREATE INDEX IF NOT EXISTS idx_chores_assigned_member 
ON chores(assigned_to_id, status) WHERE assigned_to_id IS NOT NULL;

-- Events by family and day (calendar queries)
CREATE INDEX IF NOT EXISTS idx_events_family_day 
ON events(family_id, day_of_week, start_time);

-- Rewards by family and availability
CREATE INDEX IF NOT EXISTS idx_rewards_family_available 
ON rewards(family_id, available) WHERE available = true;

-- Routines by family and member assignment
CREATE INDEX IF NOT EXISTS idx_routines_family_members 
ON routines(family_id) WHERE applies_to_member_ids IS NOT NULL;

-- Daily routine progress by member and date (most frequent lookup)
CREATE INDEX IF NOT EXISTS idx_routine_progress_member_date 
ON daily_routine_progress(member_id, date, routine_id);

-- 2. COMPOSITE INDEXES FOR COMPLEX QUERIES

-- Family data with RLS optimization
CREATE INDEX IF NOT EXISTS idx_families_invite_lookup 
ON families(invite_code) WHERE invite_code IS NOT NULL;

-- Chore types by family (management screens)
CREATE INDEX IF NOT EXISTS idx_chore_types_family_name 
ON chore_types(family_id, name);

-- 3. PARTIAL INDEXES FOR FILTERED QUERIES

-- Active chores only (completed = false)
CREATE INDEX IF NOT EXISTS idx_chores_active_family
ON chores(family_id, due_date, assigned_to_id)
WHERE status = 'pending';

-- Overdue chores for alerts
-- Note: Cannot use CURRENT_DATE in index predicate (not immutable)
-- Use regular index instead
CREATE INDEX IF NOT EXISTS idx_chores_overdue
ON chores(family_id, due_date, assigned_to_id, status);

-- Recent routine progress
-- Note: Cannot use CURRENT_DATE in index predicate (not immutable)
-- Use regular index instead
CREATE INDEX IF NOT EXISTS idx_routine_progress_recent
ON daily_routine_progress(member_id, date, is_fully_completed);

-- 4. FULL-TEXT SEARCH INDEXES (Future enhancement)

-- Family member search
CREATE INDEX IF NOT EXISTS idx_family_members_search 
ON family_members USING gin(to_tsvector('english', name || ' ' || COALESCE(nickname, '')));

-- Chore search
CREATE INDEX IF NOT EXISTS idx_chores_search 
ON chores USING gin(to_tsvector('english', title));

-- Event search  
CREATE INDEX IF NOT EXISTS idx_events_search 
ON events USING gin(to_tsvector('english', title));

-- 5. ANALYZE TABLES FOR QUERY PLANNER

ANALYZE families;
ANALYZE family_memberships;
ANALYZE family_members;
ANALYZE chores;
ANALYZE events;
ANALYZE rewards;
ANALYZE routines;
ANALYZE daily_routine_progress;
ANALYZE chore_types;

-- 6. PERFORMANCE MONITORING VIEWS
-- Note: Removed due to Supabase restrictions on system table access

-- 7. TABLE MAINTENANCE COMMANDS
-- Note: VACUUM commands removed as they cannot run in transaction blocks in Supabase
-- Supabase handles vacuuming automatically

-- Performance optimizations completed successfully!
-- All indexes created and tables analyzed