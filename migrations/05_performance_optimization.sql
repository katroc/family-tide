-- Performance Optimization for Family Planner
-- Stage 7.1: Advanced Indexing and Query Optimization

-- Enable timing for performance monitoring
\timing on

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
CREATE INDEX IF NOT EXISTS idx_chores_overdue 
ON chores(family_id, due_date, assigned_to_id) 
WHERE status = 'pending' AND due_date < CURRENT_DATE;

-- Recent routine progress (last 30 days)
CREATE INDEX IF NOT EXISTS idx_routine_progress_recent 
ON daily_routine_progress(member_id, date, is_fully_completed) 
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

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

-- Query to check index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Query to find slow queries (when pg_stat_statements is enabled)
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time
FROM pg_stat_statements 
WHERE query LIKE '%family%' OR query LIKE '%chores%' OR query LIKE '%events%'
ORDER BY mean_time DESC
LIMIT 20;

-- 7. TABLE MAINTENANCE COMMANDS

-- Update table statistics
UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0;

-- Vacuum tables for performance
VACUUM ANALYZE families;
VACUUM ANALYZE family_memberships;
VACUUM ANALYZE family_members;
VACUUM ANALYZE chores;
VACUUM ANALYZE events;
VACUUM ANALYZE rewards;
VACUUM ANALYZE routines;
VACUUM ANALYZE daily_routine_progress;

\echo 'Performance optimizations completed successfully!'
\echo 'Run \\d+ <table_name> to see indexes on specific tables'
\echo 'Run SELECT * FROM index_usage_stats; to monitor index usage'