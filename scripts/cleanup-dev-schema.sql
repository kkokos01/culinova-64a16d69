-- Clean up dev schema - remove incorrectly created extra tables
-- Run this in dev SQL Editor: https://supabase.com/dashboard/project/aajeyifqrupykjyapoft

-- Drop the extra tables that don't match production
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.shopping_items CASCADE;
DROP TABLE IF EXISTS public.shopping_lists CASCADE;
DROP TABLE IF EXISTS public.space_members CASCADE;

-- Verify the remaining tables match production
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
