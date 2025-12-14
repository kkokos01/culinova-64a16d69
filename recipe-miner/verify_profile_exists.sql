-- Verify the user profile record exists
-- This will confirm if our fix worked

SELECT * FROM user_profiles 
WHERE user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';

-- Also check all profiles for this user (in case it's in id field)
SELECT id, user_id, display_name, created_at 
FROM user_profiles 
WHERE id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26' 
   OR user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';
