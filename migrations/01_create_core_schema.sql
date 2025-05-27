-- Supabase Database Schema Migration
-- Stage 2.1: Core Tables Setup
-- Adapted from SQLite schema to support multi-family, multi-user architecture

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FAMILIES TABLE
-- Core family information (replaces single family_details from SQLite)
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'My Family',
  address TEXT DEFAULT '',
  photo_url TEXT,
  photo_object_position TEXT DEFAULT 'center center',
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'base64'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FAMILY MEMBERSHIPS TABLE  
-- Junction table linking users to families with roles
CREATE TABLE family_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'child' CHECK (role IN ('parent', 'child', 'other')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, family_id)
);

-- 3. FAMILY MEMBERS TABLE
-- Individual family members (can be linked to users or standalone)
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional link to actual user
  name TEXT NOT NULL,
  initial TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'child' CHECK (role IN ('parent', 'child', 'other')),
  color TEXT NOT NULL,
  nickname TEXT,
  dob DATE,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHORE TYPES TABLE
CREATE TABLE chore_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_points INTEGER DEFAULT 10,
  icon TEXT DEFAULT 'checkmark-circle',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, name) -- Unique per family
);

-- 5. CHORES TABLE
CREATE TABLE chores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  points INTEGER DEFAULT 10,
  due_date DATE NOT NULL,
  icon TEXT,
  chore_type_id UUID REFERENCES chore_types(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EVENTS TABLE
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
  color TEXT NOT NULL,
  attendee_ids UUID[] DEFAULT '{}', -- Array of family_member IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REWARDS TABLE
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cost INTEGER NOT NULL,
  icon TEXT DEFAULT 'gift',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ROUTINES TABLE
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  applies_to_member_ids UUID[] DEFAULT '{}', -- Array of family_member IDs
  steps JSONB NOT NULL, -- Array of routine steps with id, title, icon
  completion_points INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DAILY ROUTINE PROGRESS TABLE
CREATE TABLE daily_routine_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_step_ids TEXT[] DEFAULT '{}', -- Array of step IDs
  is_fully_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, routine_id, date)
);

-- 10. APP SETTINGS TABLE (User-specific settings)
CREATE TABLE user_app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- INDEXES for performance
CREATE INDEX idx_family_memberships_user_id ON family_memberships(user_id);
CREATE INDEX idx_family_memberships_family_id ON family_memberships(family_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_chores_family_id ON chores(family_id);
CREATE INDEX idx_chores_assigned_to_id ON chores(assigned_to_id);
CREATE INDEX idx_chores_due_date ON chores(due_date);
CREATE INDEX idx_events_family_id ON events(family_id);
CREATE INDEX idx_events_day_of_week ON events(day_of_week);
CREATE INDEX idx_rewards_family_id ON rewards(family_id);
CREATE INDEX idx_routines_family_id ON routines(family_id);
CREATE INDEX idx_daily_routine_progress_member_id ON daily_routine_progress(member_id);
CREATE INDEX idx_daily_routine_progress_date ON daily_routine_progress(date);

-- TRIGGERS for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chores_updated_at BEFORE UPDATE ON chores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routines_updated_at BEFORE UPDATE ON routines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_routine_progress_updated_at BEFORE UPDATE ON daily_routine_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_app_settings_updated_at BEFORE UPDATE ON user_app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
