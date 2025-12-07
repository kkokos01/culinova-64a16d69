-- Simplified and more reliable get_user_emails function
-- Run this in Supabase SQL Editor to fix the 400 error

DROP FUNCTION IF EXISTS public.get_user_emails(UUID[]);

CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use unnest for better compatibility
  RETURN QUERY 
  SELECT au.id as user_id, au.email 
  FROM auth.users au, unnest(user_ids) as uid
  WHERE au.id = uid;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_emails(UUID[]) TO authenticated;

-- Test the function with your user ID
SELECT 'Testing get_user_emails function:' as test;
SELECT * FROM get_user_emails(ARRAY['b7d099f6-a8e6-4780-8e83-403cbf351f3c'::uuid]);

-- Verify the function exists
SELECT 'Function created successfully:' as status, proname FROM pg_proc WHERE proname = 'get_user_emails';
