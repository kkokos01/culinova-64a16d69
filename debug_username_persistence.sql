-- Debug username persistence - run this in Supabase SQL Editor
-- Replace the user_id with your actual user ID from the console logs

-- Check if user profile exists with username
SELECT 'Checking user profile with display_name:' as debug_type;
SELECT user_id, display_name, created_at, updated_at 
FROM user_profiles 
WHERE user_id = '722e92b0-cc12-4ca7-93d1-fd7820e0c225'::uuid; -- Replace with your user ID

-- Check for any NULL display_name entries (from old trigger)
SELECT 'Checking for NULL display_name entries:' as debug_type;
SELECT user_id, display_name, created_at 
FROM user_profiles 
WHERE display_name IS NULL;

-- Check all profiles for this user (duplicates)
SELECT 'Checking all profile entries for user:' as debug_type;
SELECT id, user_id, display_name, created_at 
FROM user_profiles 
WHERE user_id = '722e92b0-cc12-4ca7-93d1-fd7820e0c225'::uuid; -- Replace with your user ID
