-- Debug Schema: Check actual table structure
-- Run this in Supabase Dashboard SQL Editor

-- Check foods table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'foods' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check units table columns  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'units' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    cmd as command,
    qual as using_condition,
    with_check as check_condition
FROM pg_policies 
WHERE tablename IN ('foods', 'units')
ORDER BY tablename, policyname;
