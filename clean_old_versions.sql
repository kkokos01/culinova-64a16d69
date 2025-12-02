-- Clean up old AI-modified versions that were persisted before temporary version system
-- Run this in Supabase Dashboard SQL Editor to remove unwanted tabs

-- First, let's see what versions exist for your recipe
SELECT 
    id,
    name,
    created_at,
    recipe_id,
    CASE 
        WHEN name LIKE 'AI Modified%' THEN 'AI Auto-Generated (should be deleted)'
        WHEN name = 'Original' THEN 'Original (keep)'
        ELSE 'User Saved (keep)'
    END as version_type
FROM recipe_versions 
WHERE recipe_id = '59078cd6-52eb-4c6d-9e9c-3bdb75011d58'
ORDER BY created_at;

-- Delete AI auto-generated versions (uncomment to run)
-- DELETE FROM recipe_versions 
-- WHERE recipe_id = '59078cd6-52eb-4c6d-9e9c-3bdb75011d58'
-- AND name LIKE 'AI Modified%';

-- Alternative: Delete all versions except 'Original' (uncomment to run)
-- DELETE FROM recipe_versions 
-- WHERE recipe_id = '59078cd6-52eb-4c6d-9e9c-3bdb75011d58'
-- AND name != 'Original';
