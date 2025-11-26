-- DATABASE DIAGNOSTIC - Run this in Supabase Dashboard SQL Editor
-- This will show us exactly what's actually in your database right now

-- 1. Check what ltree functions actually exist
SELECT 
    proname as function_name,
    pronargs as num_args,
    proargtypes as arg_types
FROM pg_proc 
WHERE proname LIKE '%ltree%' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Check what triggers actually exist on foods and units tables
SELECT 
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event_type,
    action_timing as timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('foods', 'units')
ORDER BY event_object_table, trigger_name;

-- 3. Check what RLS policies actually exist
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_condition,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('foods', 'units')
ORDER BY tablename, policyname;

-- 4. Check if ltree extension is actually installed
SELECT extname, extversion, extrelocatable 
FROM pg_extension 
WHERE extname = 'ltree';

-- 5. Check the actual structure of foods and units tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('foods', 'units') 
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
