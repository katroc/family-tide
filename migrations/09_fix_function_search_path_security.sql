-- Fix search_path security issue on all database functions
-- This prevents potential security vulnerabilities from search_path manipulation
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- 1. Fix update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- 2. Fix get_user_family_ids helper function
CREATE OR REPLACE FUNCTION get_user_family_ids()
RETURNS UUID[] AS $$
BEGIN
  RETURN (
    SELECT ARRAY_AGG(family_id)
    FROM public.family_memberships
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- 3. Fix user_belongs_to_family helper function
CREATE OR REPLACE FUNCTION user_belongs_to_family(family_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.family_memberships
    WHERE user_id = auth.uid()
    AND family_id = family_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- 4. Fix create_family function
CREATE OR REPLACE FUNCTION create_family(
  family_name TEXT DEFAULT 'My Family',
  family_address TEXT DEFAULT ''
)
RETURNS JSON AS $$
DECLARE
  new_family_id UUID;
  new_family_record RECORD;
  new_membership_id UUID;
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create the family
  INSERT INTO public.families (name, address)
  VALUES (family_name, family_address)
  RETURNING * INTO new_family_record;

  new_family_id := new_family_record.id;

  -- Add the creator as a family member (admin/parent role)
  INSERT INTO public.family_memberships (user_id, family_id, role)
  VALUES (auth.uid(), new_family_id, 'parent')
  RETURNING id INTO new_membership_id;

  -- Return the created family info
  RETURN json_build_object(
    'success', true,
    'family', row_to_json(new_family_record),
    'membership_id', new_membership_id,
    'message', 'Family created successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to create family'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- 5. Fix join_family_by_invite function
CREATE OR REPLACE FUNCTION join_family_by_invite(
  invite_code TEXT,
  user_role TEXT DEFAULT 'child'
)
RETURNS JSON AS $$
DECLARE
  target_family_id UUID;
  family_record RECORD;
  existing_membership_id UUID;
  new_membership_id UUID;
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate role
  IF user_role NOT IN ('parent', 'child', 'other') THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;

  -- Find family by invite code
  SELECT id INTO target_family_id
  FROM public.families
  WHERE families.invite_code = join_family_by_invite.invite_code;

  IF target_family_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_INVITE_CODE',
      'message', 'Invite code not found or expired'
    );
  END IF;

  -- Check if user is already a member
  SELECT id INTO existing_membership_id
  FROM public.family_memberships
  WHERE user_id = auth.uid() AND family_id = target_family_id;

  IF existing_membership_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ALREADY_MEMBER',
      'message', 'You are already a member of this family'
    );
  END IF;

  -- Add user to family
  INSERT INTO public.family_memberships (user_id, family_id, role)
  VALUES (auth.uid(), target_family_id, user_role)
  RETURNING id INTO new_membership_id;

  -- Get family details to return
  SELECT * INTO family_record
  FROM public.families
  WHERE id = target_family_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'family', row_to_json(family_record),
    'membership_id', new_membership_id,
    'role', user_role,
    'message', 'Successfully joined family'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to join family'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- 6. Fix get_user_families function
CREATE OR REPLACE FUNCTION get_user_families()
RETURNS JSON AS $$
DECLARE
  families_result JSON;
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get families user belongs to with membership info
  SELECT json_agg(
    json_build_object(
      'family', row_to_json(f),
      'membership', json_build_object(
        'role', fm.role,
        'joined_at', fm.joined_at
      )
    )
  ) INTO families_result
  FROM public.families f
  JOIN public.family_memberships fm ON f.id = fm.family_id
  WHERE fm.user_id = auth.uid();

  RETURN json_build_object(
    'success', true,
    'families', COALESCE(families_result, '[]'::json)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to get user families'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Grant permissions (re-apply in case they were lost)
GRANT EXECUTE ON FUNCTION create_family(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION join_family_by_invite(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_families() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_family_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION user_belongs_to_family(UUID) TO authenticated;

-- Comments
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp. Search path secured.';
COMMENT ON FUNCTION get_user_family_ids() IS 'Returns array of family IDs that the current user belongs to. Search path secured.';
COMMENT ON FUNCTION user_belongs_to_family(UUID) IS 'Checks if current user belongs to specified family. Search path secured.';
COMMENT ON FUNCTION create_family(TEXT, TEXT) IS 'Creates a new family and adds the current user as a parent/admin. Search path secured.';
COMMENT ON FUNCTION join_family_by_invite(TEXT, TEXT) IS 'Allows user to join a family using an invite code. Search path secured.';
COMMENT ON FUNCTION get_user_families() IS 'Returns all families the current user belongs to with membership info. Search path secured.';
