-- Fix the one problematic function causing all the issues
-- The update_food_path_function() is using direct text2ltree() instead of our wrapper

-- First, let's see what the current function looks like
SELECT prosrc FROM pg_proc WHERE proname = 'update_food_path_function';

-- Drop and recreate the function to use our wrapper
DROP FUNCTION IF EXISTS public.update_food_path_function() CASCADE;

CREATE OR REPLACE FUNCTION public.update_food_path_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only update path if it's null and we have a name
  -- Use our text2ltree_wrapper instead of direct text2ltree
  IF NEW.path IS NULL AND NEW.name IS NOT NULL THEN
    NEW.path := public.text2ltree_wrapper(LOWER(NEW.name));
  END IF;
  
  -- Also update search vectors if needed
  IF NEW.search_vector_en IS NULL AND NEW.name IS NOT NULL THEN
    NEW.search_vector_en := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, ''));
  END IF;
  
  IF NEW.search_vector_es IS NULL AND NEW.name IS NOT NULL THEN
    NEW.search_vector_es := to_tsvector('spanish', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, ''));
  END IF;
  
  RETURN NEW;
END;
$$;

-- Test that our function exists (can't call it directly since it's a trigger function)
SELECT proname FROM pg_proc WHERE proname = 'update_food_path_function';