-- Stage 3.1: Family Creation & Management RPC Functions
-- Server-side functions for family operations with proper security

-- Function 1: Create a new family and add user as admin
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
  INSERT INTO families (name, address)
  VALUES (family_name, family_address)
  RETURNING * INTO new_family_record;
  
  new_family_id := new_family_record.id;

  -- Add the creator as a family member (admin/parent role)
  INSERT INTO family_memberships (user_id, family_id, role)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Join a family using invite code
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
  FROM families
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
  FROM family_memberships
  WHERE user_id = auth.uid() AND family_id = target_family_id;

  IF existing_membership_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ALREADY_MEMBER',
      'message', 'You are already a member of this family'
    );
  END IF;

  -- Add user to family
  INSERT INTO family_memberships (user_id, family_id, role)
  VALUES (auth.uid(), target_family_id, user_role)
  RETURNING id INTO new_membership_id;

  -- Get family details to return
  SELECT * INTO family_record
  FROM families
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Get current user's families
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
  FROM families f
  JOIN family_memberships fm ON f.id = fm.family_id
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION create_family(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION join_family_by_invite(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_families() TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION create_family(TEXT, TEXT) IS 'Creates a new family and adds the current user as a parent/admin';
COMMENT ON FUNCTION join_family_by_invite(TEXT, TEXT) IS 'Allows user to join a family using an invite code';
COMMENT ON FUNCTION get_user_families() IS 'Returns all families the current user belongs to with membership info';
