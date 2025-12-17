-- Add email sending to invitation system
-- This modifies the invite_user_to_space function to send emails

-- First, install the http extension if not already installed
CREATE EXTENSION IF NOT EXISTS http SCHEMA extensions;

-- Update the invite_user_to_space function to send emails
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
  
  -- Get space name and inviter name for the email
  SELECT name INTO space_name 
  FROM public.spaces 
  WHERE id = space_id_param;
  
  SELECT display_name INTO inviter_name
  FROM public.user_profiles
  WHERE user_id = auth.uid();
  
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
  ) RETURNING id INTO invitation_id;
  
  -- Send invitation email via Edge Function
  -- Note: This will only work in production where the Edge Function is deployed
  BEGIN
    SELECT content INTO email_response
    FROM http(
      (
        SELECT 
          'https://zujlsbkxxsmiiwgyodph.supabase.co/functions/v1/send-invitation-email' AS url
      ),
      (
        SELECT 
          json_build_object(
            'invitation', json_build_object(
              'to', email_to_invite,
              'spaceName', COALESCE(space_name, 'A Collection'),
              'inviterName', COALESCE(inviter_name, 'Someone'),
              'role', INITCAP(user_role),
              'invitationId', invitation_id::text
            )
          ) AS body,
          'POST' AS method,
          json_build_object(
            'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true),
            'Content-Type', 'application/json'
          ) AS headers
      )
    );
    
    -- Parse the email response
    email_result := email_response::json;
    
    -- If email sending failed, still return success for invitation creation but note the email issue
    IF COALESCE((email_result->>'success')::boolean, false) = false THEN
      RETURN json_build_object(
        'success', true, 
        'message', 'Invitation created but email failed to send. Please ask the user to check their invitations page.',
        'email_error', COALESCE(email_result->>'error', 'Unknown email error')
      );
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- If email sending fails, log it but don't fail the invitation
    RETURN json_build_object(
      'success', true, 
      'message', 'Invitation created successfully. Please note: email delivery may be delayed.',
      'email_error', 'Email service unavailable'
    );
  END;
  
  -- Return success
  RETURN json_build_object('success', true, 'message', 'Invitation sent successfully. User will receive an email invitation.');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION invite_user_to_space(TEXT, UUID, TEXT, TEXT) TO authenticated;

-- Create a setting for the service role key (to be set by the app)
-- This is a workaround to allow the function to call Edge Functions
DO $$
BEGIN
  INSERT INTO pg_settings (name, setting)
  VALUES ('app.settings.supabase_service_role_key', 'your-service-role-key-here')
  ON CONFLICT (name) DO NOTHING;
END $$;
