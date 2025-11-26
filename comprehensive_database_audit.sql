-- COMPREHENSIVE DATABASE AUDIT - Find ALL problematic references
-- Run this in Supabase Dashboard SQL Editor

-- 1. Find ALL functions that reference text2ltree directly
SELECT 
    'FUNCTION' as object_type,
    proname as object_name,
    prosrc as source_code
FROM pg_proc 
WHERE prosrc LIKE '%text2ltree%' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname NOT LIKE '%wrapper%';

-- 2. Find ALL triggers that might use text2ltree or have user_id issues
SELECT 
    'TRIGGER' as object_type,
    trigger_name as object_name,
    event_object_table as table_name,
    action_statement as source_code
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND (action_statement LIKE '%text2ltree%' OR action_statement LIKE '%user_id%')
ORDER BY event_object_table, trigger_name;

-- 3. Find ALL check constraints that might reference user_id
SELECT 
    'CHECK CONSTRAINT' as object_type,
    tc.constraint_name as object_name,
    tc.table_name,
    cc.check_clause as source_code
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('foods', 'units')
AND (cc.check_clause LIKE '%user_id%' OR cc.check_clause LIKE '%text2ltree%');

-- 4. Find ALL column defaults that might use text2ltree
SELECT 
    'COLUMN DEFAULT' as object_type,
    column_name || ' on ' || table_name as object_name,
    column_default as source_code
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name IN ('foods', 'units')
AND column_default IS NOT NULL
AND (column_default LIKE '%text2ltree%' OR column_default LIKE '%user_id%');

-- 5. Find ALL RLS policies that might reference user_id ambiguously
SELECT 
    'RLS POLICY' as object_type,
    policyname as object_name,
    tablename as table_name,
    qual as using_condition,
    with_check as check_condition
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('foods', 'units')
AND (qual LIKE '%user_id%' OR with_check LIKE '%user_id%')
ORDER BY tablename, policyname;

-- 6. Check for any foreign key constraints that might cause issues
SELECT 
    'FOREIGN KEY' as object_type,
    tc.constraint_name as object_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('foods', 'units');
