-- Cleanup script to remove phantom memberships
-- RUN THIS TO FIX THE IMMEDIATE ISSUE

-- First, let's see what we're dealing with
SELECT 'Current state before cleanup:' as info;

SELECT 
  s.name as space_name,
  COUNT(us.id) as member_count,
  STRING_AGG(COALESCE(up.display_name, 'Unknown'), ', ') as member_names
FROM public.spaces s
LEFT JOIN public.user_spaces us ON s.id = us.space_id AND us.is_active = true
LEFT JOIN public.user_profiles up ON us.user_id = up.user_id
WHERE s.created_by = auth.uid()
GROUP BY s.id, s.name
ORDER BY s.created_at DESC;

-- Remove memberships for users that don't exist in auth.users (phantom users)
DELETE FROM public.user_spaces 
WHERE user_id NOT IN (SELECT id FROM auth.users)
  AND space_id IN (SELECT id FROM public.spaces WHERE created_by = auth.uid());

-- Remove duplicate memberships (same user in same space)
DELETE FROM public.user_spaces 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, space_id) id 
  FROM public.user_spaces 
  WHERE is_active = true 
  ORDER BY user_id, space_id, created_at DESC
);

-- Update space member counts to be accurate
UPDATE public.spaces 
SET member_count = (
  SELECT COUNT(*) 
  FROM public.user_spaces 
  WHERE user_spaces.space_id = spaces.id AND is_active = true
)
WHERE created_by = auth.uid();

-- Show the cleaned up state
SELECT 'State after cleanup:' as info;

SELECT 
  s.name as space_name,
  COUNT(us.id) as member_count,
  STRING_AGG(COALESCE(up.display_name, 'Unknown'), ', ') as member_names
FROM public.spaces s
LEFT JOIN public.user_spaces us ON s.id = us.space_id AND us.is_active = true
LEFT JOIN public.user_profiles up ON us.user_id = up.user_id
WHERE s.created_by = auth.uid()
GROUP BY s.id, s.name
ORDER BY s.created_at DESC;
