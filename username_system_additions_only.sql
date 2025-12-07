-- USERNAME SYSTEM ADDITIONS ONLY
-- For users who already ran the initial SQL files

-- =====================================================
-- 1. CREATE DATABASE TRIGGER FOR AUTO PROFILE CREATION
-- =====================================================

-- Function to automatically create user profile on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create basic user profile entry (display_name will be set later)
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (NEW.id, NULL);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger to automatically create profile when user signs up
-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. VERIFY YOUR USERNAME IS SET
-- =====================================================

-- Check your current username
SELECT 'Your current profile:' as status;
SELECT * FROM public.user_profiles WHERE user_id = 'b7d099f6-a8e6-4780-8e83-403cbf351f3c';

-- If not set to "kkokoszka", run this:
UPDATE public.user_profiles 
SET display_name = 'kkokoszka'
WHERE user_id = 'b7d099f6-a8e6-4780-8e83-403cbf351f3c'
AND display_name IS NULL;

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Verify trigger was created
SELECT 
  'Auto profile creation trigger created' as status,
  COUNT(*) as count
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Test the functions
SELECT 'Testing check_username_availability with "kkokoszka":' as test;
SELECT * FROM check_username_availability('kkokoszka');

SELECT 'Testing check_username_availability with "newuser123":' as test;
SELECT * FROM check_username_availability('newuser123');

SELECT 'Username system additions completed successfully!' as final_status;
