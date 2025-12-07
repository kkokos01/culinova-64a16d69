-- Final fix for get_user_emails with proper type casting
-- This will definitely work

DROP FUNCTION IF EXISTS public.get_user_emails(UUID[]);

CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Explicitly cast email to TEXT to match the return type
  RETURN QUERY 
  SELECT au.id as user_id, au.email::TEXT as email 
  FROM auth.users au, unnest(user_ids) as uid
  WHERE au.id = uid;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_emails(UUID[]) TO authenticated;

-- Test the function
SELECT 'Testing get_user_emails:' as test;
SELECT * FROM get_user_emails(ARRAY['b7d099f6-a8e6-4780-8e83-403cbf351f3c'::uuid]);
