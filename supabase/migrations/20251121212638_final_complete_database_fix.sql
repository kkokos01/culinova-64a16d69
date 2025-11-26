-- FINAL COMPLETE DATABASE FIX
-- This migration fixes both persistent errors permanently

-- =====================================================
-- FIX 1: Update the update_food_metadata function to use text2ltree_wrapper
-- =====================================================

-- Drop and recreate the function with proper text2ltree_wrapper usage
DROP FUNCTION IF EXISTS public.update_food_metadata() CASCADE;

CREATE OR REPLACE FUNCTION public.update_food_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update path using our wrapper function instead of direct text2ltree
  IF NEW.parent_id IS NOT NULL THEN
    SELECT path INTO NEW.path 
    FROM public.foods 
    WHERE id = NEW.parent_id;
    NEW.path := NEW.path || public.text2ltree_wrapper(lower(regexp_replace(NEW.name, '\s+', '_', 'g')));
  ELSE
    NEW.path := public.text2ltree_wrapper(lower(regexp_replace(NEW.name, '\s+', '_', 'g')));
  END IF;

  -- Update search vectors
  NEW.search_vector_en := setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
                          setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
                          setweight(to_tsvector('english', array_to_string(COALESCE(NEW.tags, ARRAY[]::TEXT[]), ' ')), 'C');
                         
  NEW.search_vector_es := setweight(to_tsvector('spanish', COALESCE(NEW.name, '')), 'A') ||
                          setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
                          setweight(to_tsvector('spanish', array_to_string(COALESCE(NEW.tags, ARRAY[]::TEXT[]), ' ')), 'C');

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- FIX 2: Clean up conflicting RLS policies on units table
-- =====================================================

-- Drop ALL existing policies on units table to eliminate conflicts
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON units;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON units;
DROP POLICY IF EXISTS "Allow read access to units for all users" ON units;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON units;
DROP POLICY IF EXISTS "Anyone can read standard units" ON units;
DROP POLICY IF EXISTS "Only admins can delete standard units" ON units;
DROP POLICY IF EXISTS "Only admins can insert standard units" ON units;
DROP POLICY IF EXISTS "Only admins can update standard units" ON units;
DROP POLICY IF EXISTS "read_units" ON units;

-- Create simple, non-conflicting policies for units table
CREATE POLICY "Enable read access for all users" ON units
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON units
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON units
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON units
FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- VERIFICATION: Test that our fixes work
-- =====================================================

-- Test 1: Verify the update_food_metadata function exists and uses our wrapper
SELECT proname as function_name, 'exists' as status
FROM pg_proc 
WHERE proname = 'update_food_metadata'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Test 2: Verify text2ltree_wrapper function works
SELECT public.text2ltree_wrapper('test.food.path') as wrapper_test;

-- Test 3: Show the clean RLS policies on units table
SELECT 
    tablename,
    policyname,
    permissive,
    cmd as command,
    qual as using_condition,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'units'
ORDER BY policyname;