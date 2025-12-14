-- Fix: Update user_spaces to set is_active = true
-- This is required by the RLS policies for spaces to be visible

UPDATE user_spaces 
SET is_active = true 
WHERE user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26'
AND space_id = 'e5d604e7-36eb-4ce2-b40b-4ab491d80c27';

-- Verify the fix
SELECT 
    us.user_id,
    us.space_id,
    us.role,
    us.is_active,
    s.name as space_name
FROM user_spaces us
JOIN spaces s ON us.space_id = s.id
WHERE us.user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';
