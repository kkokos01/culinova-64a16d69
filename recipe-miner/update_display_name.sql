-- Update user display name to "chefkoko"
UPDATE user_profiles 
SET display_name = 'chefkoko',
    updated_at = NOW()
WHERE id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';

-- Verify the update
SELECT id, display_name, created_at, updated_at 
FROM user_profiles 
WHERE id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';
