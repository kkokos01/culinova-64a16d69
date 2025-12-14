-- Recipe Approval Workflow Migration
-- Run this in Supabase SQL Editor for dev environment

-- Step 0: Add qa_status column if it doesn't exist (for environments that don't have it)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='qa_status') THEN
        ALTER TABLE recipes ADD COLUMN qa_status TEXT NOT NULL DEFAULT 'pending';
    END IF;
END $$;

-- Step 1: Add audit fields to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Step 2: Update qa_status constraint to include new approval states
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_qa_status_check;
ALTER TABLE recipes 
ADD CONSTRAINT recipes_qa_status_check 
CHECK (qa_status IN ('pending', 'pass', 'flag', 'approved_public', 'rejected_public'));

-- Step 3: Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_recipes_qa_status ON recipes(qa_status);
CREATE INDEX IF NOT EXISTS idx_recipes_approved_public ON recipes(qa_status, is_public) WHERE qa_status = 'approved_public';

-- Step 4: Create view for pending approval recipes
CREATE OR REPLACE VIEW public.pending_approval_recipes AS
SELECT 
    r.*,
    up.display_name as uploader_name,
    up.avatar_url as uploader_avatar,
    s.name as space_name,
    approver.display_name as approver_name
FROM recipes r
LEFT JOIN user_profiles up ON r.user_id = up.user_id
LEFT JOIN spaces s ON r.space_id = s.id
LEFT JOIN user_profiles approver ON r.approved_by = approver.user_id
WHERE r.qa_status IN ('pending', 'flag')
ORDER BY r.created_at DESC;

-- Step 5: Create view for public recipes
CREATE OR REPLACE VIEW public.public_recipes AS
SELECT 
    r.*,
    up.display_name as author_name,
    up.avatar_url as author_avatar,
    s.name as space_name
FROM recipes r
LEFT JOIN user_profiles up ON r.user_id = up.user_id
LEFT JOIN spaces s ON r.space_id = s.id
WHERE r.qa_status = 'approved_public' 
AND r.is_public = true
ORDER BY r.approved_at DESC, r.created_at DESC;

-- Step 6: Grant access to views
GRANT SELECT ON pending_approval_recipes TO authenticated;
GRANT SELECT ON public_recipes TO authenticated, anon;

-- Step 7: RLS policies for approval actions
-- Only space admins can approve recipes
CREATE POLICY "Space admins can approve recipes" ON recipes
    FOR UPDATE 
    USING (
        auth.uid() IN (
            SELECT user_id 
            FROM user_spaces 
            WHERE space_id = recipes.space_id 
            AND role = 'admin' 
            AND is_active = true
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id 
            FROM user_spaces 
            WHERE space_id = recipes.space_id 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Step 8: Function to approve recipe with audit trail
CREATE OR REPLACE FUNCTION approve_recipe_public(recipe_id UUID, approver_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    space_admin BOOLEAN;
BEGIN
    -- Check if approver is admin of the recipe's space
    SELECT EXISTS(
        SELECT 1 
        FROM user_spaces 
        WHERE user_id = approver_id 
        AND space_id = (SELECT space_id FROM recipes WHERE id = recipe_id)
        AND role = 'admin' 
        AND is_active = true
    ) INTO space_admin;
    
    IF NOT space_admin THEN
        RAISE EXCEPTION 'User is not authorized to approve this recipe';
    END IF;
    
    -- Update recipe with approval
    UPDATE recipes 
    SET 
        qa_status = 'approved_public',
        is_public = true,
        privacy_level = 'public',
        approved_by = approver_id,
        approved_at = NOW()
    WHERE id = recipe_id;
    
    RETURN FOUND;
END;
$$;

-- Step 9: Function to reject recipe with feedback
CREATE OR REPLACE FUNCTION reject_recipe_public(recipe_id UUID, approver_id UUID, feedback TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    space_admin BOOLEAN;
    current_description TEXT;
BEGIN
    -- Check if approver is admin of the recipe's space
    SELECT EXISTS(
        SELECT 1 
        FROM user_spaces 
        WHERE user_id = approver_id 
        AND space_id = (SELECT space_id FROM recipes WHERE id = recipe_id)
        AND role = 'admin' 
        AND is_active = true
    ) INTO space_admin;
    
    IF NOT space_admin THEN
        RAISE EXCEPTION 'User is not authorized to reject this recipe';
    END IF;
    
    -- Get current description
    SELECT description INTO current_description 
    FROM recipes 
    WHERE id = recipe_id;
    
    -- Update recipe with rejection
    UPDATE recipes 
    SET 
        qa_status = 'rejected_public',
        description = CASE 
            WHEN feedback IS NOT NULL THEN 
                'REJECTED: ' || feedback || E'\n\n' || COALESCE(current_description, '')
            ELSE current_description
        END,
        approved_by = approver_id,
        approved_at = NOW()
    WHERE id = recipe_id;
    
    RETURN FOUND;
END;
$$;
