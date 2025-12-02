-- Check recipes table structure to identify field name mismatches
-- Run this in Supabase Dashboard SQL Editor

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recipes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check a sample recipe to see actual data
SELECT * FROM recipes LIMIT 1;
