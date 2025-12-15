-- Fix Recipe Integrity: Add admin_notes, clean orphans, add FK constraints, fix RLS

-- 1. Add Admin Notes Column
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS admin_notes text;

-- 2. Cleanup Orphaned Recipes (Safety First)
DELETE FROM public.recipes 
WHERE space_id IS NOT NULL 
AND space_id NOT IN (SELECT id FROM public.spaces WHERE id IS NOT NULL);

-- 3. Add Foreign Key Constraints (Now Safe)
-- Space relationship with cascade delete
ALTER TABLE public.recipes
DROP CONSTRAINT IF EXISTS fk_recipes_space,
ADD CONSTRAINT fk_recipes_space 
FOREIGN KEY (space_id) 
REFERENCES public.spaces(id) 
ON DELETE CASCADE;

-- User relationship with set null on delete
ALTER TABLE public.recipes
DROP CONSTRAINT IF EXISTS fk_recipes_user,
ADD CONSTRAINT fk_recipes_user 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- 4. Fix RLS Policies for Public Visibility
-- Allow public profile viewing
CREATE POLICY IF NOT EXISTS "Public profiles viewable" ON public.user_profiles FOR SELECT USING (true);

-- Allow viewing spaces that are public OR contain public recipes
CREATE POLICY IF NOT EXISTS "Spaces with public recipes viewable" ON public.spaces FOR SELECT 
USING (
  is_public = true OR 
  id IN (
    SELECT DISTINCT space_id FROM public.recipes 
    WHERE qa_status = 'approved_public' AND is_public = true
  )
);
