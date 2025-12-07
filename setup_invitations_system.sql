-- Comprehensive SQL Script for Culinova Invitation System
-- This script sets up the complete in-app notification and approval system
-- Run this entire script in Supabase SQL Editor

-- =====================================================
-- 1. CREATE SPACE_INVITATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.space_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL,
  inviter_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  email_address text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'editor'::text, 'viewer'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'expired'::text])),
  message text DEFAULT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone DEFAULT NULL,
  CONSTRAINT space_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT space_invitations_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE CASCADE,
  CONSTRAINT space_invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT space_invitations_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_space_invitations_recipient_status ON public.space_invitations(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_space_invitations_space_id ON public.space_invitations(space_id);
CREATE INDEX IF NOT EXISTS idx_space_invitations_expires_at ON public.space_invitations(expires_at);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.space_invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies first (PostgreSQL doesn't support CREATE POLICY IF NOT EXISTS)
DROP POLICY IF EXISTS "Users can view own invitations" ON public.space_invitations;
DROP POLICY IF EXISTS "Users can view sent invitations" ON public.space_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON public.space_invitations;
DROP POLICY IF EXISTS "Users can update own invitations" ON public.space_invitations;

-- Users can view invitations sent to them
CREATE POLICY "Users can view own invitations" ON public.space_invitations
FOR SELECT USING (recipient_id = auth.uid());

-- Users can view invitations they sent in their spaces (must be admin)
CREATE POLICY "Users can view sent invitations" ON public.space_invitations
FOR SELECT USING (
  inviter_id = auth.uid() AND 
  space_id IN (
    SELECT space_id FROM public.user_spaces 
    WHERE user_id = auth.uid() AND is_active = true AND role = 'admin'
  )
);

-- Users can insert invitations (they must be admin of the space)
CREATE POLICY "Admins can create invitations" ON public.space_invitations
FOR INSERT WITH CHECK (
  inviter_id = auth.uid() AND
  space_id IN (
    SELECT space_id FROM public.user_spaces 
    WHERE user_id = auth.uid() AND is_active = true AND role = 'admin'
  )
);

-- Users can update their own invitations status
CREATE POLICY "Users can update own invitations" ON public.space_invitations
FOR UPDATE USING (recipient_id = auth.uid());

-- =====================================================
-- 5. CREATE/UPDATE INVITE_USER_TO_SPACE FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS public.invite_user_to_space(TEXT, UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.invite_user_to_space(
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

-- =====================================================
-- 6. CREATE ACCEPT_INVITATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.accept_space_invitation(
  invitation_id_param UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  existing_membership RECORD;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record 
  FROM public.space_invitations 
  WHERE id = invitation_id_param AND recipient_id = auth.uid();
  
  -- If invitation doesn't exist or doesn't belong to user
  IF invitation_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invitation not found.');
  END IF;
  
  -- Check if invitation is still pending
  IF invitation_record.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Invitation is no longer valid.');
  END IF;
  
  -- Check if invitation hasn't expired
  IF invitation_record.expires_at < now() THEN
    -- Update status to expired
    UPDATE public.space_invitations 
    SET status = 'expired', updated_at = now() 
    WHERE id = invitation_id_param;
    RETURN json_build_object('success', false, 'error', 'Invitation has expired.');
  END IF;
  
  -- Check if user is already a member
  SELECT * INTO existing_membership 
  FROM public.user_spaces 
  WHERE user_id = invitation_record.recipient_id 
    AND space_id = invitation_record.space_id 
    AND is_active = true;
  
  IF existing_membership IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You are already a member of this collection.');
  END IF;
  
  -- Add user to space
  INSERT INTO public.user_spaces (
    user_id, 
    space_id, 
    role, 
    is_active,
    created_at
  ) VALUES (
    invitation_record.recipient_id,
    invitation_record.space_id,
    invitation_record.role,
    true,
    now()
  );
  
  -- Update invitation status
  UPDATE public.space_invitations 
  SET status = 'accepted', 
      responded_at = now(),
      updated_at = now() 
  WHERE id = invitation_id_param;
  
  -- Create activity record for the acceptance
  INSERT INTO public.activities (
    space_id,
    actor_id,
    action_type,
    entity_id,
    entity_type,
    details,
    created_at
  ) VALUES (
    invitation_record.space_id,
    invitation_record.recipient_id,
    'user_joined',
    invitation_record.recipient_id,
    'member',
    json_build_object(
      'invited_email', invitation_record.email_address,
      'role', invitation_record.role,
      'invited_by', invitation_record.inviter_id,
      'accepted_at', now()
    ),
    invitation_record.created_at -- Use original invitation timestamp
  );
  
  RETURN json_build_object('success', true, 'message', 'Successfully joined the collection!');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =====================================================
-- 7. CREATE REJECT_INVITATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.reject_space_invitation(
  invitation_id_param UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record 
  FROM public.space_invitations 
  WHERE id = invitation_id_param AND recipient_id = auth.uid();
  
  -- If invitation doesn't exist or doesn't belong to user
  IF invitation_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invitation not found.');
  END IF;
  
  -- Check if invitation is still pending
  IF invitation_record.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Invitation is no longer valid.');
  END IF;
  
  -- Update invitation status
  UPDATE public.space_invitations 
  SET status = 'rejected', 
      responded_at = now(),
      updated_at = now() 
  WHERE id = invitation_id_param;
  
  RETURN json_build_object('success', true, 'message', 'Invitation rejected.');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =====================================================
-- 8. CREATE CLEANUP FUNCTION FOR EXPIRED INVITATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.space_invitations 
  SET status = 'expired', updated_at = now() 
  WHERE status = 'pending' AND expires_at < now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$;

-- =====================================================
-- 9. GRANT EXECUTE PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.invite_user_to_space(TEXT, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_space_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_space_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_invitations() TO authenticated;

-- =====================================================
-- 10. ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON TABLE public.space_invitations IS 'Pending invitations for users to join spaces, requiring approval';
COMMENT ON COLUMN public.space_invitations.status IS 'Invitation status: pending, accepted, rejected, expired';
COMMENT ON COLUMN public.space_invitations.expires_at IS 'When the invitation automatically expires';
COMMENT ON COLUMN public.space_invitations.responded_at IS 'When the user responded to the invitation';

-- =====================================================
-- 11. VERIFICATION QUERIES
-- =====================================================

-- Verify table was created correctly
SELECT 'space_invitations table created successfully' as status, COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'space_invitations' AND table_schema = 'public';

-- Verify indexes were created
SELECT 'Indexes created successfully' as status, COUNT(*) as index_count
FROM pg_indexes 
WHERE tablename = 'space_invitations' AND schemaname = 'public';

-- Verify functions were created
SELECT 'Functions created successfully' as status, COUNT(*) as function_count
FROM pg_proc 
WHERE proname IN ('invite_user_to_space', 'accept_space_invitation', 'reject_space_invitation', 'cleanup_expired_invitations')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Verify RLS is enabled
SELECT 'RLS enabled successfully' as status, rowsecurity
FROM pg_tables 
WHERE tablename = 'space_invitations' AND schemaname = 'public';

-- Verify policies were created
SELECT 'Policies created successfully' as status, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'space_invitations' AND schemaname = 'public';

-- =====================================================
-- 12. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Uncomment the following lines to create sample data for testing:
/*
-- Create a test invitation (you'll need to replace the UUIDs with actual values from your database)
INSERT INTO public.space_invitations (
  space_id,
  inviter_id,
  recipient_id,
  email_address,
  role,
  message,
  created_at
) VALUES (
  'your-space-id-here', -- Replace with actual space UUID
  'your-inviter-id-here', -- Replace with actual inviter UUID
  'your-recipient-id-here', -- Replace with actual recipient UUID
  'test@example.com',
  'viewer',
  'Welcome to my collection!',
  now()
);
*/

SELECT 'Invitation system setup completed successfully!' as final_status;
