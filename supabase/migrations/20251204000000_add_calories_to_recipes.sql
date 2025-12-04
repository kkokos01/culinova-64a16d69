-- Add calories_per_serving field to recipes table
-- This will store AI-estimated calorie count per serving

ALTER TABLE recipes 
ADD COLUMN calories_per_serving INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN recipes.calories_per_serving IS 'AI-estimated calorie count per serving (nullable)';
