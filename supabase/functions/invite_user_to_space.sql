-- Invite user to space by email (creates pending invitation)
-- This function looks up a user by email and creates a pending invitation
CREATE OR REPLACE FUNCTION invite_user_to_space(
  email_to_invite TEXT,
  space_id_param UUID,
  user_role TEXT DEFAULT 'viewer',
  invitation_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invited_user_id UUID;
  existing_invitation RECORD;
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
  
  -- Check if there's already a pending invitation
  SELECT * INTO existing_invitation 
  FROM public.space_invitations 
  WHERE recipient_id = invited_user_id 
    AND space_id = space_id_param 
    AND status = 'pending';
  
  -- If there's already a pending invitation, return appropriate message
  IF existing_invitation IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'User already has a pending invitation to this collection.');
  END IF;
  
  -- Check if user is already a member
  SELECT * INTO existing_invitation 
  FROM public.user_spaces 
  WHERE user_id = invited_user_id AND space_id = space_id_param AND is_active = true;
  
  -- If already a member, return appropriate message
  IF existing_invitation IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'User is already a member of this collection.');
  END IF;
  
  -- Create pending invitation
  INSERT INTO public.space_invitations (
    space_id,
    inviter_id,
    recipient_id,
    email_address,
    role,
    message,
    created_at
  ) VALUES (
    space_id_param,
    auth.uid(),
    invited_user_id,
    email_to_invite,
    user_role,
    invitation_message,
    now()
  );
  
  -- Return success
  RETURN json_build_object('success', true, 'message', 'Invitation sent successfully. User will need to accept the invitation to join the collection.');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION invite_user_to_space(TEXT, UUID, TEXT, TEXT) TO authenticated;
