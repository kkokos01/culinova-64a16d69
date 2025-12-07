-- Fix stale member counts for all spaces
-- Run this in Supabase SQL Editor

UPDATE public.spaces 
SET member_count = (
  SELECT COUNT(*) 
  FROM public.user_spaces 
  WHERE user_spaces.space_id = spaces.id AND is_active = true
)
WHERE created_by = auth.uid();

-- Verify the fix
SELECT 
  name,
  member_count as updated_count,
  (SELECT COUNT(*) FROM public.user_spaces WHERE space_id = spaces.id AND is_active = true) as actual_count
FROM public.spaces 
WHERE created_by = auth.uid();
