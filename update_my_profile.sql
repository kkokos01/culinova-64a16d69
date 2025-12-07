-- Simple fix: Update your profile with your actual name
-- This will show proper initials instead of "U"

UPDATE public.user_profiles 
SET display_name = 'Your Name Here'  -- Replace with your actual name
WHERE user_id = 'b7d099f6-a8e6-4780-8e83-403cbf351f3c';

-- Or if you prefer, just set it to show "K"
UPDATE public.user_profiles 
SET display_name = 'K'
WHERE user_id = 'b7d099f6-a8e6-4780-8e83-403cbf351f3c';

-- Verify the update
SELECT * FROM public.user_profiles WHERE user_id = 'b7d099f6-a8e6-4780-8e83-403cbf351f3c';
