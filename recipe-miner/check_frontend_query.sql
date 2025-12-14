-- Check what the frontend query would actually return
-- This simulates the exact query the frontend might be making

-- Simulate the frontend query with RLS
-- Run this with "Set role to authenticated" and "Set JWT to user token" 
-- or check if there's a function that handles this

-- Common pattern: Frontend might be using a function
SELECT * FROM get_user_spaces('3a9d183d-24d4-4cb6-aaf0-38635aa47c26');

-- Or directly querying with the pattern the frontend expects
SELECT 
    s.id,
    s.name,
    s.description,
    s.is_public,
    us.role,
    us.created_at as joined_at
FROM spaces s
JOIN user_spaces us ON s.id = us.space_id
WHERE us.user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26'
AND us.is_active = true
ORDER BY us.created_at DESC;

-- Check if there's a view or function the frontend uses
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%space%' OR routine_name LIKE '%collection%');
