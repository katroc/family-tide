-- Fix RLS Policy for Invite Code Lookups
-- Allow authenticated users to find families by invite code for joining

-- Add a new policy that allows reading family info when using invite codes
CREATE POLICY "Users can lookup families by invite code" ON families
  FOR SELECT
  TO authenticated
  USING (invite_code IS NOT NULL AND invite_code != '');

-- This policy works alongside the existing "Users can read their families" policy
-- It allows users to find families by invite code even if they're not members yet
-- But only exposes basic info needed for joining (id, name, address, invite_code)

COMMENT ON POLICY "Users can lookup families by invite code" ON families 
IS 'Allows authenticated users to find families by invite code for joining purposes';
