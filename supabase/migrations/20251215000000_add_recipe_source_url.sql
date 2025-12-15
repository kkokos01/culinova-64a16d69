-- Add source_url column to recipes table for tracking imported recipes
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS source_url text;
