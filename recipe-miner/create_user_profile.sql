-- Create missing user profile
-- This is required for the app to work properly

INSERT INTO user_profiles (
    id,
    display_name,
    created_at,
    updated_at
) VALUES (
    '3a9d183d-24d4-4cb6-aaf0-38635aa47c26',
    'Test User',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

-- Verify the profile was created
SELECT * FROM user_profiles 
WHERE id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';
