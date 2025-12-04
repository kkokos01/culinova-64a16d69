-- Fix ltree function and investigate ambiguous user_id issues
-- This addresses the remaining critical errors

-- First, verify ltree extension is properly installed
SELECT extname, extversion FROM pg_extension WHERE extname = 'ltree';

-- Drop and recreate the ltree wrapper function with proper syntax
DROP FUNCTION IF EXISTS public.text2ltree_wrapper(text_input);

CREATE OR REPLACE FUNCTION public.text2ltree_wrapper(text_input text)
RETURNS ltree
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN text2ltree(text_input);
END;
$$;

-- Grant proper permissions
GRANT EXECUTE ON FUNCTION public.text2ltree_wrapper(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.text2ltree_wrapper(text) TO anon;
GRANT EXECUTE ON FUNCTION public.text2ltree_wrapper(text) TO service_role;

-- Test the function works
SELECT public.text2ltree_wrapper('food.category.item') as test_result;

-- Check for triggers that might have ambiguous user_id references
SELECT 
  event_object_table,
  trigger_name,
  action_condition,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND (action_statement LIKE '%user_id%' OR action_condition LIKE '%user_id%');

-- Check for any RLS policies that might have ambiguous user_id
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND (qual LIKE '%user_id%' OR with_check LIKE '%user_id%');

-- Check if there are any user_id columns in units table (shouldn't be any)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'units' 
AND column_name = 'user_id';