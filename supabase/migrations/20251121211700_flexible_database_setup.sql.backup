-- Flexible Database Migration - Enable Playful Recipe Creation
-- This migration relaxes strict constraints to improve user experience

-- Phase 1: Relax RLS Policies for Authenticated Reads
DROP POLICY IF EXISTS "Users can view foods in their spaces" ON foods;
DROP POLICY IF EXISTS "Users can insert foods in their spaces" ON foods;
DROP POLICY IF EXISTS "Users can update foods in their spaces" ON foods;
DROP POLICY IF EXISTS "Users can delete foods in their spaces" ON foods;

-- Create relaxed RLS policies for foods
CREATE POLICY "Enable read access for all authenticated users on foods" ON foods
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on foods" ON foods
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Enable update for own foods" ON foods
FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Enable delete for own foods" ON foods
FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Drop and recreate relaxed RLS policies for units
DROP POLICY IF EXISTS "Users can view units in their spaces" ON units;
DROP POLICY IF EXISTS "Users can insert units in their spaces" ON units;
DROP POLICY IF EXISTS "Users can update units in their spaces" ON units;
DROP POLICY IF EXISTS "Users can delete units in their spaces" ON units;

CREATE POLICY "Enable read access for all authenticated users on units" ON units
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on units" ON units
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Enable update for own units" ON units
FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Enable delete for own units" ON units
FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Phase 2: Remove Strict Unit Validation Constraints
ALTER TABLE units DROP CONSTRAINT IF EXISTS valid_unit_check;

-- Phase 3: Add Smart Defaults for Flexible Data
ALTER TABLE ingredients ALTER COLUMN order_index SET DEFAULT 0;
ALTER TABLE ingredients ALTER COLUMN order_index DROP NOT NULL;

-- Allow more flexible unit types by extending the enum
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'custom';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'volume_imperial';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'volume_metric';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'weight_imperial';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'weight_metric';

-- Phase 4: Enable RLS on all tables (ensure it's working)
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Phase 5: Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_foods_name_space ON foods(name, space_id);
CREATE INDEX IF NOT EXISTS idx_units_name ON units(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe ON ingredients(recipe_id);

-- Verification queries
SELECT 
    'foods' as table_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'foods'
UNION ALL
SELECT 
    'units' as table_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'units';

SELECT 
    tablename,
    policyname,
    permissive,
    cmd as command,
    qual as using_condition
FROM pg_policies 
WHERE tablename IN ('foods', 'units')
ORDER BY tablename, policyname;
