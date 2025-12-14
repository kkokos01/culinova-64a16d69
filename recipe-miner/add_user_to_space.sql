-- Add user to the Kitchen Stage space
-- This creates the user-space relationship so they can see the collection

INSERT INTO user_spaces (
    user_id,
    space_id,
    role,
    created_at
) VALUES (
    '3a9d183d-24d4-4cb6-aaf0-38635aa47c26',
    'e5d604e7-36eb-4ce2-b40b-4ab491d80c27',
    'admin',
    NOW()
);

-- Verify the user can now see the space
SELECT 
    us.user_id,
    us.space_id,
    us.role,
    s.name as space_name
FROM user_spaces us
JOIN spaces s ON us.space_id = s.id
WHERE us.user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';
