-- Fix user_profiles record - move UUID from id to user_id field
-- The frontend queries by user_id, not id

-- First, delete the incorrect record
DELETE FROM user_profiles 
WHERE id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';

-- Then insert with correct field mapping
INSERT INTO user_profiles (
    id,  -- This should be a generated UUID
    user_id,  -- This should be the user's UUID
    display_name,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '3a9d183d-24d4-4cb6-aaf0-38635aa47c26',
    'chefkoko',
    NOW(),
    NOW()
);

-- Verify the fix
SELECT id, user_id, display_name 
FROM user_profiles 
WHERE user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';
