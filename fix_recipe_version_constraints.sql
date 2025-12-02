-- Fix recipe_version_ingredients constraints to allow null food_id and unit_id
-- This aligns with our simplified foodUnitMapper that returns text-only results

-- Drop the NOT NULL constraint on food_id
ALTER TABLE recipe_version_ingredients 
ALTER COLUMN food_id DROP NOT NULL;

-- Drop the NOT NULL constraint on unit_id  
ALTER TABLE recipe_version_ingredients 
ALTER COLUMN unit_id DROP NOT NULL;

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recipe_version_ingredients' 
AND table_schema = 'public'
AND column_name IN ('food_id', 'unit_id')
ORDER BY ordinal_position;
