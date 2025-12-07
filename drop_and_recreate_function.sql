-- Drop the existing function (if it exists)
DROP FUNCTION IF EXISTS invite_user_to_space;

-- Recreate with correct parameter order
CREATE OR REPLACE FUNCTION invite_user_to_space(
  email_to_invite TEXT,
  space_id_param UUID,
  user_role TEXT DEFAULT 'viewer'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invited_user_id UUID;
  existing_membership RECORD;
  result JSON;
BEGIN
  -- Validate role
  IF user_role NOT IN ('admin', 'editor', 'viewer') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role. Must be admin, editor, or viewer.');
  END IF;
  
  -- Look up user by email in auth.users
  SELECT id INTO invited_user_id 
  FROM auth.users 
  WHERE email = email_to_invite;
  
  -- If user doesn't exist, return error
  IF invited_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No user found with that email address.');
  END IF;
  
  -- Prevent users from inviting themselves
  IF invited_user_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'You cannot invite yourself to a collection.');
  END IF;
  
  -- Check if user is already a member
  SELECT * INTO existing_membership 
  FROM public.user_spaces 
  WHERE user_id = invited_user_id AND space_id = space_id_param AND is_active = true;
  
  -- If already a member, return appropriate message
  IF existing_membership IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'User is already a member of this collection.');
  END IF;
  
  -- Add user to space
  INSERT INTO public.user_spaces (
    user_id, 
    space_id, 
    role, 
    is_active,
    created_at
  ) VALUES (
    invited_user_id,
    space_id_param,
    user_role,
    true,
    now()
  );
  
  -- Create activity record for the invitation
  INSERT INTO public.activities (
    space_id,
    actor_id,
    action_type,
    entity_id,
    entity_type,
    details,
    created_at
  ) VALUES (
    space_id_param,
    auth.uid(),
    'user_joined',
    invited_user_id,
    'member',
    json_build_object(
      'invited_email', email_to_invite,
      'role', user_role
    ),
    now()
  );
  
  -- Return success
  RETURN json_build_object('success', true, 'message', 'User successfully added to collection.');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION invite_user_to_space(TEXT, UUID, TEXT) TO authenticated;
