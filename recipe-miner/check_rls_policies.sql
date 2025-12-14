-- Check RLS policies on user_spaces and spaces tables
-- Run this in the Supabase SQL Editor

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_spaces', 'spaces') 
AND schemaname = 'public';

-- Check RLS policies for user_spaces
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_spaces' 
AND schemaname = 'public';

-- Check RLS policies for spaces
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'spaces' 
AND schemaname = 'public';

-- Test if anon role can access user_spaces
SET ROLE anon;
SELECT COUNT(*) FROM user_spaces WHERE user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';

-- Test if anon role can access spaces
SELECT COUNT(*) FROM spaces WHERE id = 'e5d604e7-36eb-4ce2-b40b-4ab491d80c27';

-- Reset role
RESET ROLE;
