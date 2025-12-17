-- Complete invitation system supporting both existing and new users

-- First, modify space_invitations to allow email-only invitations
ALTER TABLE space_invitations 
ALTER COLUMN recipient_id DROP NOT NULL,
ADD COLUMN IF NOT EXISTS is_email_only BOOLEAN DEFAULT FALSE;

-- Create function to handle both existing and new user invitations
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
  invitation_id UUID;
  space_name TEXT;
  inviter_name TEXT;
  email_response TEXT;
  email_result JSON;
BEGIN
  -- Validate role
  IF user_role NOT IN ('admin', 'editor', 'viewer') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role. Must be admin, editor, or viewer.');
  END IF;
  
  -- Prevent users from inviting themselves
  IF email_to_invite = (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'You cannot invite yourself to a collection.');
  END IF;
  
  -- Check if user exists
  SELECT id INTO invited_user_id 
  FROM auth.users 
  WHERE email = email_to_invite;
  
  -- Get space name for messaging
  SELECT name INTO space_name 
  FROM public.spaces 
  WHERE id = space_id_param;
  
  -- Get inviter name
  SELECT display_name INTO inviter_name
  FROM public.user_profiles
  WHERE user_id = auth.uid();
  
  IF invited_user_id IS NOT NULL THEN
    -- EXISTING USER FLOW
    
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
    
    -- Create pending invitation for existing user
    INSERT INTO public.space_invitations (
      space_id,
      inviter_id,
      recipient_id,
      email_address,
      role,
      message,
      is_email_only,
      created_at
    ) VALUES (
      space_id_param,
      auth.uid(),
      invited_user_id,
      email_to_invite,
      user_role,
      invitation_message,
      false,
      now()
    ) RETURNING id INTO invitation_id;
    
    -- Return success - user will be notified in-app
    RETURN json_build_object(
      'success', true, 
      'message', 'Invitation sent. User will be notified in-app.',
      'invitation_id', invitation_id,
      'user_exists', true
    );
    
  ELSE
    -- NEW USER FLOW
    
    -- Check if we already sent an invitation to this email
    SELECT * INTO existing_invitation 
    FROM public.space_invitations 
    WHERE email_address = email_to_invite 
      AND space_id = space_id_param 
      AND status = 'pending'
      AND is_email_only = true;
    
    IF existing_invitation IS NOT NULL THEN
      RETURN json_build_object('success', false, 'error', 'An invitation has already been sent to this email address.');
    END IF;
    
    -- Create email-only invitation
    INSERT INTO public.space_invitations (
      space_id,
      inviter_id,
      recipient_id, -- NULL for email-only
      email_address,
      role,
      message,
      is_email_only,
      created_at
    ) VALUES (
      space_id_param,
      auth.uid(),
      NULL,
      email_to_invite,
      user_role,
      invitation_message,
      true,
      now()
    ) RETURNING id INTO invitation_id;
    
    -- TODO: Send email invitation via Supabase Auth
    -- This will be handled by the client calling an Edge Function
    
    -- Return success with note about email
    RETURN json_build_object(
      'success', true, 
      'message', 'Invitation email sent. User will be able to join after signing up.',
      'invitation_id', invitation_id,
      'user_exists', false
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION invite_user_to_space(TEXT, UUID, TEXT, TEXT) TO authenticated;

-- Create function to handle post-signup invitation acceptance
CREATE OR REPLACE FUNCTION accept_pending_invitations_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_invitation RECORD;
  space_name TEXT;
BEGIN
  -- Check if this user has any pending email-only invitations
  FOR pending_invitation IN 
    SELECT * FROM space_invitations 
    WHERE email_address = NEW.email 
      AND is_email_only = true 
      AND status = 'pending'
  LOOP
    -- Get space name for notification
    SELECT name INTO space_name
    FROM spaces
    WHERE id = pending_invitation.space_id;
    
    -- Accept the invitation by creating user_spaces record
    INSERT INTO user_spaces (
      user_id,
      space_id,
      role,
      is_active,
      created_at
    ) VALUES (
      NEW.id,
      pending_invitation.space_id,
      pending_invitation.role,
      true,
      now()
    );
    
    -- Update invitation status
    UPDATE space_invitations 
    SET status = 'accepted',
        responded_at = now(),
        recipient_id = NEW.id
    WHERE id = pending_invitation.id;
    
    -- Log the auto-accept
    RAISE LOG 'Auto-accepted invitation for % to space %', NEW.email, space_name;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-accept invitations on user signup
DROP TRIGGER IF EXISTS on_user_signup_accept_invitations ON auth.users;
CREATE TRIGGER on_user_signup_accept_invitations
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION accept_pending_invitations_on_signup();
