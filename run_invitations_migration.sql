-- Run this script in Supabase SQL Editor to create the invitations system
-- Copy and paste the entire contents of supabase/migrations/20251205000000_create_space_invitations.sql
-- Then run this verification script to confirm everything was created correctly

-- Verification script
SELECT 'Checking space_invitations table exists' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'space_invitations' 
ORDER BY ordinal_position;

SELECT 'Checking indexes exist' as status;
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'space_invitations';

SELECT 'Checking functions exist' as status;
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname IN ('accept_space_invitation', 'reject_space_invitation', 'cleanup_expired_invitations');

SELECT 'Checking RLS is enabled' as status;
SELECT rowsecurity 
FROM pg_tables 
WHERE tablename = 'space_invitations';

SELECT 'Checking policies exist' as status;
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'space_invitations';
