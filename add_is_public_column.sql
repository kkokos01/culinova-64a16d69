-- Add is_public column to spaces table
ALTER TABLE spaces ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Add description column to spaces table  
ALTER TABLE spaces ADD COLUMN description TEXT;

-- Add member_count and recipe_count columns (computed via triggers or views if needed)
ALTER TABLE spaces ADD COLUMN member_count INTEGER DEFAULT 1;
ALTER TABLE spaces ADD COLUMN recipe_count INTEGER DEFAULT 0;

-- Update existing spaces to be private by default
UPDATE spaces SET is_public = false WHERE is_public IS NULL;

-- Add index for performance on public spaces query
CREATE INDEX idx_spaces_public_active ON spaces(is_public, is_active) WHERE is_public = true AND is_active = true;

-- Optional: Add trigger to update member_count when users join/leave spaces
-- This would require additional setup
