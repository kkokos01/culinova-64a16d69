-- COMPLETE USERNAME SYSTEM SETUP
-- Run this entire script in Supabase SQL Editor

-- =====================================================
-- 1. ADD UNIQUE CONSTRAINT TO USER_PROFILES
-- =====================================================

-- Add unique constraint to ensure username uniqueness at database level
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_display_name_unique UNIQUE (display_name);

-- =====================================================
-- 2. CREATE USERNAME VALIDATION FUNCTIONS
-- =====================================================

-- Function to check username availability and suggest alternatives
CREATE OR REPLACE FUNCTION public.check_username_availability(username TEXT)
RETURNS TABLE(is_available BOOLEAN, suggestions TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_name TEXT;
  counter INTEGER := 1;
  suggestion_list TEXT[] := '{}';
BEGIN
  -- Check if username is available
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE display_name = username) THEN
    RETURN QUERY SELECT true, ARRAY[]::TEXT[];
    RETURN;
  END IF;
  
  -- Generate suggestions
  base_name := username;
  
  -- Add numbers to username until we find available ones
  WHILE counter <= 5 LOOP
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE display_name = base_name || counter::TEXT) THEN
      suggestion_list := array_append(suggestion_list, base_name || counter::TEXT);
    END IF;
    counter := counter + 1;
  END LOOP;
  
  -- Try adding random words
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE display_name = username || '_app') THEN
    suggestion_list := array_append(suggestion_list, username || '_app');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE display_name = username || '_chef') THEN
    suggestion_list := array_append(suggestion_list, username || '_chef');
  END IF;
  
  RETURN QUERY SELECT false, suggestion_list;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_username_availability(TEXT) TO authenticated;

-- Function to create user profile with username
CREATE OR REPLACE FUNCTION public.create_user_profile_with_username(
  user_id_param UUID,
  username_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert user profile with username
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (user_id_param, username_param);
  
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    -- Username already taken
    RETURN FALSE;
  WHEN OTHERS THEN
    -- Other error
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile_with_username(UUID, TEXT) TO authenticated;

-- =====================================================
-- 3. CREATE DATABASE TRIGGER FOR AUTO PROFILE CREATION
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
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 4. UPDATE YOUR USERNAME
-- =====================================================

-- Set your username to "kkokoszka"
UPDATE public.user_profiles 
SET display_name = 'kkokoszka'
WHERE user_id = 'b7d099f6-a8e6-4780-8e83-403cbf351f3c';

-- =====================================================
-- 5. VERIFICATION
-- =====================================================

-- Verify functions were created
SELECT 
  'check_username_availability function created' as status,
  COUNT(*) as count
FROM pg_proc 
WHERE proname = 'check_username_availability' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'create_user_profile_with_username function created' as status,
  COUNT(*) as count
FROM pg_proc 
WHERE proname = 'create_user_profile_with_username' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Verify unique constraint was added
SELECT 
  'Unique constraint on display_name' as status,
  COUNT(*) as count
FROM pg_constraint 
WHERE conname = 'user_profiles_display_name_unique';

-- Verify trigger was created
SELECT 
  'Auto profile creation trigger created' as status,
  COUNT(*) as count
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Test the functions with your user ID
SELECT 'Testing check_username_availability with "kkokoszka":' as test;
SELECT * FROM check_username_availability('kkokoszka');

SELECT 'Your profile after update:' as test;
SELECT * FROM public.user_profiles WHERE user_id = 'b7d099f6-a8e6-4780-8e83-403cbf351f3c';

SELECT 'Complete username system setup finished successfully!' as final_status;
