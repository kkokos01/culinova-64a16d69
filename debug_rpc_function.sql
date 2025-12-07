-- Debug RPC function - run this in Supabase SQL Editor

-- Check if function exists
SELECT 'Function exists check:' as debug_type,
       proname, 
       pronamespace::regnamespace as schema_name
FROM pg_proc 
WHERE proname = 'check_username_availability';

-- Check function permissions
SELECT 'Function permissions:' as debug_type,
       pg_get_userbyid(proowner) as owner,
       proacl as permissions
FROM pg_proc 
WHERE proname = 'check_username_availability';

-- Test the function directly
SELECT 'Direct function test:' as debug_type;
SELECT * FROM check_username_availability('testuser123');

-- Check if authenticated role has execute permission
SELECT 'Authenticated role permissions:' as debug_type,
       has_function_privilege('authenticated', 'check_username_availability(text)', 'EXECUTE') as can_execute;

-- Check if anon role has execute permission (for unauthenticated users)
SELECT 'Anon role permissions:' as debug_type,
       has_function_privilege('anon', 'check_username_availability(text)', 'EXECUTE') as can_execute;
