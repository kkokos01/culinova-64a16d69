-- Debug script to investigate phantom memberships
-- Run this in Supabase SQL Editor to see what's happening

-- 1. Check how many memberships exist per space
SELECT 
  s.name as space_name,
  s.id as space_id,
  COUNT(us.id) as member_count,
  STRING_AGG(up.display_name, ', ') as member_names
FROM public.spaces s
LEFT JOIN public.user_spaces us ON s.id = us.space_id AND us.is_active = true
LEFT JOIN public.user_profiles up ON us.user_id = up.user_id
WHERE s.created_by = auth.uid() -- Only your spaces
GROUP BY s.id, s.name
ORDER BY s.created_at DESC;

-- 2. Check all memberships for your spaces with user details
SELECT 
  us.id,
  us.space_id,
  us.user_id,
  us.role,
  us.is_active,
  us.created_at,
  s.name as space_name,
  up.display_name,
  up.email_address,
  CASE 
    WHEN au.id IS NOT NULL THEN 'Real User'
    ELSE 'Phantom/Fake User'
  END as user_status
FROM public.user_spaces us
JOIN public.spaces s ON us.space_id = s.id
LEFT JOIN public.user_profiles up ON us.user_id = up.user_id
LEFT JOIN auth.users au ON us.user_id = au.id
WHERE s.created_by = auth.uid()
ORDER BY s.created_at, us.created_at;

-- 3. Check for any test/mock/seed functions that might be creating users
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname ILIKE '%test%' 
   OR proname ILIKE '%mock%' 
   OR proname ILIKE '%seed%'
   OR proname ILIKE '%demo%'
   OR proname ILIKE '%default%'
   AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Check recent migrations that might have added test data
SELECT version, description, applied_at, success 
FROM public.schema_migrations 
ORDER BY applied_at DESC 
LIMIT 10;

-- 5. Look for any triggers on user_spaces table
SELECT tgname, tgrelid::regclass as table_name, tgfoid::regproc as function_name, tgtype as trigger_type
FROM pg_trigger 
WHERE tgrelid = 'public.user_spaces'::regclass AND NOT tgisinternal;

-- 6. Check if there are any functions that auto-create memberships
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc ILIKE '%user_spaces%' 
   OR prosrc ILIKE '%INSERT INTO user_spaces%'
   AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 7. Simple cleanup query to remove phantom memberships (RUN WITH CAUTION)
-- This will remove memberships for users that don't exist in auth.users
/*
DELETE FROM public.user_spaces 
WHERE user_id NOT IN (SELECT id FROM auth.users) 
  AND space_id IN (SELECT id FROM public.spaces WHERE created_by = auth.uid());
*/
