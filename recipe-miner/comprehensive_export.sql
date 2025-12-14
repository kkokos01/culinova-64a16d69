-- ========================================
-- COMPREHENSIVE ENVIRONMENT EXPORT
-- Run this in Supabase SQL Editor for BOTH environments
-- Save results as environment_export_[env].json
-- ========================================

-- 1. RECIPES TABLE STRUCTURE (Most Critical)
SELECT 
    'recipes_structure' as section,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'recipes'
ORDER BY ordinal_position;

-- 2. RECIPES TABLE CONSTRAINTS
SELECT 
    'recipes_constraints' as section,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'recipes'
ORDER BY tc.constraint_name;

-- 3. APPROVAL WORKFLOW VIEWS
SELECT 
    'approval_views' as section,
    table_name as view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
    AND (table_name LIKE '%approval%' OR table_name LIKE '%pending%' OR table_name LIKE '%public%')
ORDER BY view_name;

-- 4. RLS POLICIES ON RECIPES
SELECT 
    'recipes_rls' as section,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE tablename = 'recipes'
ORDER BY policyname;

-- 5. RPC FUNCTIONS (Approval Related)
SELECT 
    'rpc_functions' as section,
    proname as function_name,
    prosrc as source_code,
    prosecdef as security_definer
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
    AND (proname LIKE '%approval%' OR proname LIKE '%recipe%')
ORDER BY proname;

-- 6. MIGRATIONS APPLIED
SELECT 
    'migrations' as section,
    version,
    name,
    installed_on
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- 7. SAMPLE RECIPES DATA (Check qa_status values)
SELECT 
    'recipes_sample' as section,
    qa_status,
    is_public,
    privacy_level,
    approved_by,
    approved_at,
    COUNT(*) as count
FROM recipes
GROUP BY qa_status, is_public, privacy_level, approved_by, approved_at
ORDER BY qa_status;

-- 8. USER_SPACES RLS (Admin Check)
SELECT 
    'user_spaces_rls' as section,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE tablename = 'user_spaces'
ORDER BY policyname;

-- 9. INDEXES ON RECIPES
SELECT 
    'recipes_indexes' as section,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'recipes'
ORDER BY indexname;

-- 10. TRIGGERS
SELECT 
    'triggers' as section,
    event_object_table,
    trigger_name,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
