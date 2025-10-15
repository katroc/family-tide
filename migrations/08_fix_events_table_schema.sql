-- Fix events table schema to match application code expectations
-- The app expects specific dated events, not weekly recurring events

-- Drop the old columns that aren't being used
ALTER TABLE events
DROP COLUMN IF EXISTS day_of_week,
DROP COLUMN IF EXISTS start_time;

-- Rename end_time to match what the code expects (keeping it for backwards compatibility)
-- But actually the code uses endTime as optional string in HH:mm format, so we keep end_time as TIME

-- Add the date column that the code expects
ALTER TABLE events
ADD COLUMN date TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add an index on date for performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- Update the existing index to use date instead of day_of_week
DROP INDEX IF EXISTS idx_events_day_of_week;

COMMENT ON COLUMN events.date IS 'The specific date and time of the event (ISO timestamp)';
COMMENT ON COLUMN events.end_time IS 'Optional end time in HH:mm format';
