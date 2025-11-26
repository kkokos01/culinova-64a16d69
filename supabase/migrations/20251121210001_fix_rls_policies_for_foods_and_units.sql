-- Fix RLS policies for foods and units tables
-- This resolves 406 Not Acceptable errors by creating proper policies

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('foods', 'units');

-- Drop existing restrictive policies on foods (if they exist)
DROP POLICY IF EXISTS "Users can view own foods" ON foods;
DROP POLICY IF EXISTS "Users can insert own foods" ON foods;
DROP POLICY IF EXISTS "Users can update own foods" ON foods;
DROP POLICY IF EXISTS "Users can delete own foods" ON foods;
DROP POLICY IF EXISTS "Enable read access for all users" ON foods;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON foods;
DROP POLICY IF EXISTS "Enable update for all users" ON foods;
DROP POLICY IF EXISTS "Enable delete for all users" ON foods;

-- Drop existing restrictive policies on units (if they exist)
DROP POLICY IF EXISTS "Users can view own units" ON units;
DROP POLICY IF EXISTS "Users can insert own units" ON units;
DROP POLICY IF EXISTS "Users can update own units" ON units;
DROP POLICY IF EXISTS "Users can delete own units" ON units;
DROP POLICY IF EXISTS "Enable read access for all users" ON units;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON units;
DROP POLICY IF EXISTS "Enable update for all users" ON units;
DROP POLICY IF EXISTS "Enable delete for all users" ON units;

-- Create proper RLS policies for foods table
-- Allow reads for authenticated users based on space membership
CREATE POLICY "Users can view foods in their spaces" ON foods
FOR SELECT USING (
  space_id IN (
    SELECT space_id FROM user_spaces 
    WHERE user_id = auth.uid() AND is_active = true
  ) OR space_id IS NULL
);

-- Allow inserts for authenticated users in their spaces
CREATE POLICY "Users can insert foods in their spaces" ON foods
FOR INSERT WITH CHECK (
  space_id IN (
    SELECT space_id FROM user_spaces 
    WHERE user_id = auth.uid() AND is_active = true
  ) OR space_id IS NULL
);

-- Allow updates for foods in user's spaces
CREATE POLICY "Users can update foods in their spaces" ON foods
FOR UPDATE USING (
  space_id IN (
    SELECT space_id FROM user_spaces 
    WHERE user_id = auth.uid() AND is_active = true
  ) OR space_id IS NULL
);

-- Allow deletes for foods in user's spaces
CREATE POLICY "Users can delete foods in their spaces" ON foods
FOR DELETE USING (
  space_id IN (
    SELECT space_id FROM user_spaces 
    WHERE user_id = auth.uid() AND is_active = true
  ) OR space_id IS NULL
);

-- Create proper RLS policies for units table
-- Units are more permissive since they're shared reference data
CREATE POLICY "Allow read access to units for all users" ON units
FOR SELECT USING (true);

-- Allow inserts for authenticated users
CREATE POLICY "Allow insert for authenticated users" ON units
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow updates for authenticated users
CREATE POLICY "Allow update for authenticated users" ON units
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow deletes for authenticated users
CREATE POLICY "Allow delete for authenticated users" ON units
FOR DELETE USING (auth.role() = 'authenticated');

-- Ensure RLS is enabled on both tables
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Show the final policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('foods', 'units')
ORDER BY tablename, policyname;