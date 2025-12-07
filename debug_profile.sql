-- Debug script to check user profile data
-- Run this in Supabase SQL Editor

-- Check your current user ID
SELECT 'Your auth.users ID:' as info, auth.uid() as user_id;

-- Check if you have a user_profiles entry
SELECT 'Your user_profiles entry:' as info, 
  up.id, up.user_id, up.display_name, up.avatar_url,
  CASE WHEN up.user_id IS NULL THEN '❌ Missing profile' ELSE '✅ Profile exists' END as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE au.id = auth.uid();

-- Check all user_spaces for your spaces
SELECT 'Your space memberships:' as info,
  us.id, us.space_id, us.user_id, us.role, us.is_active,
  s.name as space_name,
  up.display_name,
  CASE WHEN up.user_id IS NULL THEN '❌ No profile' ELSE '✅ Has profile' END as profile_status
FROM public.user_spaces us
JOIN public.spaces s ON us.space_id = s.id
LEFT JOIN public.user_profiles up ON us.user_id = up.user_id
WHERE s.created_by = auth.uid() AND us.is_active = true
ORDER BY s.name, us.created_at;
