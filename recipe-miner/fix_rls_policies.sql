-- Fix RLS policies for user_spaces and spaces tables
-- Run this in the Supabase SQL Editor for the dev environment

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own spaces" ON user_spaces;
DROP POLICY IF EXISTS "Users can insert their own spaces" ON user_spaces;
DROP POLICY IF EXISTS "Users can update their own spaces" ON user_spaces;
DROP POLICY IF EXISTS "Users can delete their own spaces" ON user_spaces;

DROP POLICY IF EXISTS "Users can view spaces they are members of" ON spaces;
DROP POLICY IF EXISTS "Space members can update spaces" ON spaces;
DROP POLICY IF EXISTS "Space admins can delete spaces" ON spaces;

-- Create proper RLS policies for user_spaces
CREATE POLICY "Users can view their own spaces" ON user_spaces
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spaces" ON user_spaces
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spaces" ON user_spaces
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spaces" ON user_spaces
    FOR DELETE USING (auth.uid() = user_id);

-- Create proper RLS policies for spaces
CREATE POLICY "Users can view spaces they are members of" ON spaces
    FOR SELECT USING (
        id IN (
            SELECT space_id 
            FROM user_spaces 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Space members can update spaces" ON spaces
    FOR UPDATE USING (
        id IN (
            SELECT space_id 
            FROM user_spaces 
            WHERE user_id = auth.uid() AND is_active = true AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Space admins can delete spaces" ON spaces
    FOR DELETE USING (
        id IN (
            SELECT space_id 
            FROM user_spaces 
            WHERE user_id = auth.uid() AND is_active = true AND role = 'admin'
        )
    );

-- Ensure RLS is enabled
ALTER TABLE user_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
