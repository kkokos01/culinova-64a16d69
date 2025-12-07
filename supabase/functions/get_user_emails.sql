-- Helper function to get user emails for display purposes
-- This allows the MemberManagement component to show proper initials

CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  single_user UUID;
BEGIN
  -- Create a temporary table to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_emails (
    user_id UUID,
    email TEXT
  );
  
  -- Clear the table
  TRUNCATE TABLE temp_user_emails;
  
  -- Insert emails for each valid user
  FOR single_user IN ARRAY user_ids
  LOOP
    INSERT INTO temp_user_emails (user_id, email)
    SELECT id, email 
    FROM auth.users 
    WHERE id = single_user;
  END LOOP;
  
  -- Return the results
  RETURN QUERY SELECT * FROM temp_user_emails;
  
  -- Clean up
  DROP TABLE IF EXISTS temp_user_emails;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_emails(UUID[]) TO authenticated;
