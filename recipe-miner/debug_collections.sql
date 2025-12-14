-- Debug: Check complete user setup for collections visibility
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if user exists in auth.users
SELECT id, email, created_at FROM auth.users 
WHERE id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';

-- 2. Check if user profile exists
SELECT * FROM user_profiles 
WHERE id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';

-- 3. Check user_spaces with full details
SELECT 
    us.*,
    s.name as space_name,
    s.is_public,
    s.created_at as space_created
FROM user_spaces us
JOIN spaces s ON us.space_id = s.id
WHERE us.user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';

-- 4. Check recipes in those spaces
SELECT 
    r.id,
    r.title,
    r.space_id,
    s.name as space_name,
    r.user_id
FROM recipes r
JOIN spaces s ON r.space_id = s.id
WHERE r.space_id IN (
    SELECT space_id 
    FROM user_spaces 
    WHERE user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26'
);

-- 5. Check RLS policies on spaces table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'spaces' OR tablename = 'user_spaces';
