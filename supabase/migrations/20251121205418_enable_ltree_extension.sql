-- Phase 1: Enable PostgreSQL Extensions
-- This fixes the "function text2ltree(text) does not exist" error

-- Enable the ltree extension for hierarchical data structures
CREATE EXTENSION IF NOT EXISTS ltree;

-- Verify the extension is working
SELECT text2ltree('food.category.item') as test_ltree_function;

-- Create a wrapper function for ltree that can be called via REST API
CREATE OR REPLACE FUNCTION public.text2ltree_wrapper(text_input text)
RETURNS ltree
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN text2ltree(text_input);
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.text2ltree_wrapper(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.text2ltree_wrapper(text) TO anon;

-- Phase 2: Check Unit Type Enum Values
-- Show current enum values to verify 'mass' is available
SELECT enumlabel AS unit_type_values 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'unit_type')
ORDER BY enumlabel;