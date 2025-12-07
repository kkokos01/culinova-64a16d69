-- =====================================================
-- COMPLETE MEMBER MANAGEMENT SYSTEM SETUP
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CREATE get_auth_users FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_auth_users(user_ids UUID[])
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  valid_users UUID[] := '{}';
  single_user UUID;
BEGIN
  -- Check each user ID and add to array if it exists in auth.users
  FOREACH single_user IN ARRAY user_ids
  LOOP
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = single_user) THEN
      valid_users := array_append(valid_users, single_user);
    END IF;
  END LOOP;
  
  RETURN valid_users;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_auth_users(UUID[]) TO authenticated;

-- =====================================================
-- 2. CREATE get_user_emails FUNCTION (Simplified)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple RETURN QUERY approach (no temporary tables)
  RETURN QUERY 
  SELECT id as user_id, email 
  FROM auth.users 
  WHERE id = ANY(user_ids);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_emails(UUID[]) TO authenticated;

-- =====================================================
-- 3. FIX STALE MEMBER COUNTS
-- =====================================================

-- Update member counts for all spaces (not just auth.uid() spaces)
UPDATE public.spaces 
SET member_count = (
  SELECT COUNT(*) 
  FROM public.user_spaces 
  WHERE user_spaces.space_id = spaces.id AND is_active = true
);

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Verify functions were created
SELECT 
  'get_auth_users function created' as status,
  COUNT(*) as count
FROM pg_proc 
WHERE proname = 'get_auth_users' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'get_user_emails function created' as status,
  COUNT(*) as count
FROM pg_proc 
WHERE proname = 'get_user_emails' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Verify member counts are now accurate
SELECT 
  'Member counts updated' as status,
  name as space_name,
  member_count as cached_count,
  (SELECT COUNT(*) FROM public.user_spaces WHERE space_id = spaces.id AND is_active = true) as actual_count,
  CASE 
    WHEN member_count = (SELECT COUNT(*) FROM public.user_spaces WHERE space_id = spaces.id AND is_active = true) 
    THEN '✅ Accurate' 
    ELSE '❌ Mismatch' 
  END as verification
FROM public.spaces 
ORDER BY created_at DESC;

-- Test the functions with your user ID (replace with actual ID from earlier)
-- This is optional - uncomment to test with your actual user ID
/*
SELECT 'Testing get_auth_users:' as test, get_auth_users(ARRAY['b7d099f6-a8e6-4780-8e83-403cbf351f3c'::uuid]) as valid_users;
SELECT 'Testing get_user_emails:' as test, * FROM get_user_emails(ARRAY['b7d099f6-a8e6-4780-8e83-403cbf351f3c'::uuid]);
*/

SELECT 'Member management system setup completed successfully!' as final_status;
