-- Add active_tab column to families table
-- This column stores the last active tab for the family UI

ALTER TABLE families
ADD COLUMN active_tab TEXT DEFAULT 'family';

-- Add a comment for documentation
COMMENT ON COLUMN families.active_tab IS 'Stores the last active tab in the UI (family, calendar, chores, or routines)';
