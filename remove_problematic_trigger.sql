-- Remove the problematic trigger that's causing race conditions
-- This trigger creates NULL profiles before we can save usernames

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verify trigger is removed
SELECT 'Trigger removed successfully' as status,
       COUNT(*) as count
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

SELECT 'Function removed successfully' as status,
       COUNT(*) as count
FROM pg_proc 
WHERE proname = 'handle_new_user';
