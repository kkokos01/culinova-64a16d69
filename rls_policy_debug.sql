-- RLS POLICY DEBUG - Check current state
-- Run this in Supabase Dashboard SQL Editor

-- 1. Check if RLS is actually enabled on foods and units tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('foods', 'units');

-- 2. Show current RLS policies on both tables
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_condition,
    with_check as check_condition
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('foods', 'units')
ORDER BY tablename, policyname;

-- 3. Test what auth.uid() returns for current session
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- 4. Check if user_spaces relationship exists for foods access
SELECT 
    user_id,
    space_id,
    is_active,
    role
FROM user_spaces 
WHERE user_id = auth.uid() 
LIMIT 5;
