-- Test RLS policies with actual authentication
-- Run this in Supabase SQL Editor to simulate the frontend query

-- First, let's check what policies actually exist
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename IN ('user_spaces', 'spaces') 
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Test the exact query the frontend makes with authenticated user
-- Note: This simulates an authenticated user, not anon
SELECT COUNT(*) FROM user_spaces 
WHERE user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26' 
AND is_active = true;

-- Test spaces query
SELECT COUNT(*) FROM spaces 
WHERE id IN (
    SELECT space_id FROM user_spaces 
    WHERE user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26' 
    AND is_active = true
) AND is_active = true;
