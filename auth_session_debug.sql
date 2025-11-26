-- DEBUG: Check current Supabase auth session
-- Run this in Supabase Dashboard SQL Editor

-- Check if there's an active session in the current context
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    auth.jwt() as jwt_token;

-- Also check if RLS policies are working with the current auth state
SELECT 
    'RLS Test' as test_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('foods', 'units');
