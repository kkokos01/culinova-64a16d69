-- Helper function to check which user IDs exist in auth.users
-- This allows the MemberManagement component to identify phantom users

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
