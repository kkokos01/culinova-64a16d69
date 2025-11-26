-- Simplified Flexible Database Migration
-- Make foods policies match the working units approach

-- Drop all complex foods policies
DROP POLICY IF EXISTS "Foods: modify by admin or editor" ON foods;
DROP POLICY IF EXISTS "Foods: select by space" ON foods;
DROP POLICY IF EXISTS "Users can delete foods in their spaces" ON foods;
DROP POLICY IF EXISTS "Users can delete foods they created" ON foods;
DROP POLICY IF EXISTS "Users can insert foods in their spaces" ON foods;
DROP POLICY IF EXISTS "Users can insert their own foods" ON foods;
DROP POLICY IF EXISTS "Users can select foods they created or in their spaces" ON foods;
DROP POLICY IF EXISTS "Users can update foods in their spaces" ON foods;
DROP POLICY IF EXISTS "Users can update foods they created or in their spaces" ON foods;
DROP POLICY IF EXISTS "Users can view foods in their spaces" ON foods;

-- Create simple foods policies (matching units approach)
CREATE POLICY "Enable read access for all users on foods" ON foods
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users on foods" ON foods
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on foods" ON foods
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on foods" ON foods
FOR DELETE USING (auth.role() = 'authenticated');

-- Phase 2: Remove Strict Unit Validation Constraints
ALTER TABLE units DROP CONSTRAINT IF EXISTS valid_unit_check;

-- Phase 3: Add Smart Defaults for Flexible Data
ALTER TABLE ingredients ALTER COLUMN order_index SET DEFAULT 0;
ALTER TABLE ingredients ALTER COLUMN order_index DROP NOT NULL;

-- Verification queries
SELECT 
    tablename,
    policyname,
    permissive,
    cmd as command,
    qual as using_condition,
    with_check as check_condition
FROM pg_policies 
WHERE tablename IN ('foods', 'units')
ORDER BY tablename, policyname;
