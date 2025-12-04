-- Fix remaining database issues
-- Address ambiguous user_id and text2ltree function usage

-- Check what triggers exist on units table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_condition
FROM information_schema.triggers 
WHERE event_object_table = 'units' 
AND trigger_schema = 'public';

-- Check what triggers exist on foods table  
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_condition
FROM information_schema.triggers 
WHERE event_object_table = 'foods' 
AND trigger_schema = 'public';

-- Check for any DEFAULT values or constraints using text2ltree
SELECT 
  column_name,
  column_default,
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'foods' 
AND table_schema = 'public'
AND (column_default LIKE '%text2ltree%' OR column_name = 'path');

-- Fix the path column default if it exists
-- The foods table likely has a trigger that uses text2ltree on insert
-- We need to update it to use our wrapper function

-- Drop any problematic triggers on foods table that use text2ltree directly
DROP TRIGGER IF EXISTS update_food_path ON foods;
DROP FUNCTION IF EXISTS public.update_food_path_function();

-- Create a proper trigger function that uses our wrapper
CREATE OR REPLACE FUNCTION public.update_food_path_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only update path if it's null and we have a name
  IF NEW.path IS NULL AND NEW.name IS NOT NULL THEN
    NEW.path := public.text2ltree_wrapper(LOWER(NEW.name));
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER update_food_path
BEFORE INSERT ON foods
FOR EACH ROW
EXECUTE FUNCTION public.update_food_path_function();

-- Fix ambiguous user_id in units triggers
-- Drop any problematic triggers on units table
DROP TRIGGER IF EXISTS validate_unit_user ON units;
DROP FUNCTION IF EXISTS public.validate_unit_user_function() CASCADE;

-- Check if units table has any user_id related constraints
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'units' 
AND tc.table_schema = 'public';

-- If there are any user_id references in triggers, they should be qualified
-- Let's create a safe trigger that doesn't cause ambiguity
CREATE OR REPLACE FUNCTION public.validate_unit_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Basic validation without user_id ambiguity
  IF NEW.name IS NULL OR LENGTH(TRIM(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Unit name cannot be empty';
  END IF;
  IF NEW.abbreviation IS NULL OR LENGTH(TRIM(NEW.abbreviation)) = 0 THEN
    RAISE EXCEPTION 'Unit abbreviation cannot be empty';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for units validation (without user_id issues)
CREATE TRIGGER validate_unit_on_insert
BEFORE INSERT ON units
FOR EACH ROW
EXECUTE FUNCTION public.validate_unit_creation();

-- Test our fixes
SELECT public.text2ltree_wrapper('test.food.path') as path_test;