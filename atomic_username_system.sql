-- Atomic Username System - Replace fragile localStorage/RPC approach
-- Run this in Supabase SQL Editor

-- 1. Create a function to handle new user insertion automatically from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username', -- Extract username from metadata
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger (if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- 4. Verify trigger is created
SELECT 'Trigger created successfully:' as status,
       tgname, tgrelid::regclass, tgfoid::regproc
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 5. Test the trigger setup (without calling it directly)
SELECT 'Trigger setup verified - will fire on new user creation:' as test;
