-- Set your username to "kkokoszka"
UPDATE public.user_profiles 
SET display_name = 'kkokoszka'
WHERE user_id = 'b7d099f6-a8e6-4780-8e83-403cbf351f3c';

-- Verify the update
SELECT * FROM public.user_profiles WHERE user_id = 'b7d099f6-a8e6-4780-8e83-403cbf351f3c';
