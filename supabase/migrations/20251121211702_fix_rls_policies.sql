-- Fix remaining RLS issues for food and unit lookups
-- This ensures all authenticated users can read foods and units

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Users can view foods in their spaces" ON foods;
DROP POLICY IF EXISTS "Users can insert foods" ON foods;
DROP POLICY IF EXISTS "Users can update foods" ON foods;
DROP POLICY IF EXISTS "Users can delete foods" ON foods;

-- Create simple, flexible policies for foods (no user_id dependency)
CREATE POLICY "Enable read access for all authenticated users" ON foods
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for all authenticated users" ON foods
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for all authenticated users" ON foods
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for all authenticated users" ON foods
  FOR DELETE USING (auth.role() = 'authenticated');

-- Ensure units policies are also correct
DROP POLICY IF EXISTS "Users can view units" ON units;
DROP POLICY IF EXISTS "Users can insert units" ON units;
DROP POLICY IF EXISTS "Users can update units" ON units;
DROP POLICY IF EXISTS "Users can delete units" ON units;

CREATE POLICY "Enable read access for all authenticated users" ON units
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for all authenticated users" ON units
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for all authenticated users" ON units
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for all authenticated users" ON units
  FOR DELETE USING (auth.role() = 'authenticated');

-- Also fix user_spaces policies to ensure proper access
DROP POLICY IF EXISTS "Users can view their spaces" ON user_spaces;
DROP POLICY IF EXISTS "Users can insert space memberships" ON user_spaces;
DROP POLICY IF EXISTS "Users can update their space memberships" ON user_spaces;
DROP POLICY IF EXISTS "Users can delete their space memberships" ON user_spaces;

CREATE POLICY "Enable read access for user's own memberships" ON user_spaces
  FOR SELECT USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Enable insert for user's own memberships" ON user_spaces
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Enable update for user's own memberships" ON user_spaces
  FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Enable delete for user's own memberships" ON user_spaces
  FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Fix spaces policies too
DROP POLICY IF EXISTS "Users can view spaces they are members of" ON spaces;
DROP POLICY IF EXISTS "Users can insert spaces" ON spaces;
DROP POLICY IF EXISTS "Users can update spaces they admin" ON spaces;
DROP POLICY IF EXISTS "Users can delete spaces they admin" ON spaces;

CREATE POLICY "Enable read access for spaces via memberships" ON spaces
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    id IN (
      SELECT space_id FROM user_spaces 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Enable insert for spaces" ON spaces
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for spaces based on membership" ON spaces
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    id IN (
      SELECT space_id FROM user_spaces 
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Enable delete for spaces based on membership" ON spaces
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    id IN (
      SELECT space_id FROM user_spaces 
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );
