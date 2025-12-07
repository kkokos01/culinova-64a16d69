-- Fix signup permissions - grant functions to anon role for unauthenticated users
-- Run this in Supabase SQL Editor

-- Grant check_username_availability to anon role (for signup flow)
GRANT EXECUTE ON FUNCTION public.check_username_availability(TEXT) TO anon;

-- Grant create_user_profile_with_username to anon role (for email verification callback)
GRANT EXECUTE ON FUNCTION public.create_user_profile_with_username(UUID, TEXT) TO anon;

-- Verify permissions were granted
SELECT 'check_username_availability anon permissions:' as debug_type,
       has_function_privilege('anon', 'check_username_availability(text)', 'EXECUTE') as can_execute;

SELECT 'create_user_profile_with_username anon permissions:' as debug_type,
       has_function_privilege('anon', 'create_user_profile_with_username(uuid, text)', 'EXECUTE') as can_execute;

-- Test the function works with anon role
SELECT 'Testing function with anon role:' as debug_type;
SELECT * FROM check_username_availability('testuser123');
