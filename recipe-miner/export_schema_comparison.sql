-- ========================================
-- DATABASE COMPARISON EXPORT SCRIPT
-- Run this in BOTH dev and production Supabase SQL Editor
-- Save results as schema_export_[env].json
-- ========================================

-- 1. TABLES AND COLUMNS
SELECT 
    'tables_columns' as section,
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- 2. VIEWS
SELECT 
    'views' as section,
    viewname as view_name,
    definition,
    schemaname
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 3. FUNCTIONS (including RPC)
SELECT 
    'functions' as section,
    proname as function_name,
    prosrc as source_code,
    proargtypes as argument_types,
    prorettype as return_type,
    prosecdef as security_definer
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

-- 4. RLS POLICIES
SELECT 
    'rls_policies' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. INDEXES
SELECT 
    'indexes' as section,
    schemaname,
    tablename,
    indexname,
    indexdef as definition
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 6. CONSTRAINTS
SELECT 
    'constraints' as section,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
LEFT JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 7. TRIGGERS
SELECT 
    'triggers' as section,
    event_object_table as table_name,
    trigger_name,
    action_timing,
    action_condition,
    action_statement,
    action_orientation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY table_name, trigger_name;

-- 8. MIGRATIONS TABLE (if exists)
SELECT 
    'migrations' as section,
    *
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- 9. CHECK RECIPES TABLE STRUCTURE (specific to approval workflow)
SELECT 
    'recipes_table_audit' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'recipes'
    AND column_name IN ('qa_status', 'approved_by', 'approved_at', 'is_public', 'privacy_level')
ORDER BY ordinal_position;
