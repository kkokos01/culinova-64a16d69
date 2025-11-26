-- TARGETED DEBUG - Check the specific function we missed
-- Run this in Supabase Dashboard SQL Editor

-- 1. Check the update_food_metadata function source code (this is the real culprit!)
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc 
WHERE proname = 'update_food_metadata'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Check ALL RLS policies with simpler search (not just user_id specific)
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_condition,
    with_check as check_condition
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('foods', 'units')
ORDER BY tablename, policyname;

-- 3. Check if there are any functions that call text2ltree but aren't named with ltree
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc 
WHERE prosrc LIKE '%text2ltree%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
