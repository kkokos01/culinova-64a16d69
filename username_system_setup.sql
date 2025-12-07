-- Username System Database Setup
-- Run this in Supabase SQL Editor

-- Add unique constraint to ensure username uniqueness
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_display_name_unique UNIQUE (display_name);

-- Create function to check username availability and suggest alternatives
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

-- Create function to automatically create user profile with username
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
