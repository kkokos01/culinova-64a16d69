-- Find your profile by showing all user_profiles
-- Look for your profile (likely with "K" or your name in display_name)

SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  created_at,
  'Your profile should be here - look for your name/initial' as note
FROM public.user_profiles 
ORDER BY created_at DESC;

-- Also check all your space memberships to see which user_id you're using
SELECT 
  us.id as membership_id,
  us.space_id,
  us.user_id,
  us.role,
  s.name as space_name,
  up.display_name,
  up.avatar_url,
  CASE 
    WHEN up.user_id IS NULL THEN '❌ NO PROFILE - This is the problem!'
    ELSE '✅ Has profile'
  END as status
FROM public.user_spaces us
JOIN public.spaces s ON us.space_id = s.id
LEFT JOIN public.user_profiles up ON us.user_id = up.user_id
WHERE s.created_by = auth.uid() OR us.user_id = auth.uid()
ORDER BY s.name, us.created_at;
