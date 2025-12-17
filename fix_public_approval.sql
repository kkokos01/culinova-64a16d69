-- Fix public recipe approval function to handle recipes with no space_id
-- Run this in Supabase SQL Editor

-- First, let's check if the function exists and needs updating
CREATE OR REPLACE FUNCTION approve_recipe_public(recipe_id UUID, approver_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    space_admin BOOLEAN;
    recipe_space_id UUID;
BEGIN
    -- Get the recipe's space_id
    SELECT space_id INTO recipe_space_id FROM recipes WHERE id = recipe_id;
    
    -- If recipe has no space_id (public collection), check if user is admin of the special Public Collection space
    IF recipe_space_id IS NULL THEN
        SELECT EXISTS(
            SELECT 1 
            FROM user_spaces 
            WHERE user_id = approver_id 
            AND space_id = '00000000-0000-0000-0000-000000000000' -- Public Collection space ID
            AND role = 'admin' 
            AND is_active = true
        ) INTO space_admin;
    ELSE
        -- For regular space recipes, check if user is admin of that space
        SELECT EXISTS(
            SELECT 1 
            FROM user_spaces 
            WHERE user_id = approver_id 
            AND space_id = recipe_space_id
            AND role = 'admin' 
            AND is_active = true
        ) INTO space_admin;
    END IF;
    
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

-- Also update the reject function for consistency
CREATE OR REPLACE FUNCTION reject_recipe_public(recipe_id UUID, approver_id UUID, feedback TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    space_admin BOOLEAN;
    recipe_space_id UUID;
    current_description TEXT;
BEGIN
    -- Get the recipe's space_id
    SELECT space_id, description INTO recipe_space_id, current_description FROM recipes WHERE id = recipe_id;
    
    -- If recipe has no space_id (public collection), check if user is admin of the special Public Collection space
    IF recipe_space_id IS NULL THEN
        SELECT EXISTS(
            SELECT 1 
            FROM user_spaces 
            WHERE user_id = approver_id 
            AND space_id = '00000000-0000-0000-0000-000000000000' -- Public Collection space ID
            AND role = 'admin' 
            AND is_active = true
        ) INTO space_admin;
    ELSE
        -- For regular space recipes, check if user is admin of that space
        SELECT EXISTS(
            SELECT 1 
            FROM user_spaces 
            WHERE user_id = approver_id 
            AND space_id = recipe_space_id
            AND role = 'admin' 
            AND is_active = true
        ) INTO space_admin;
    END IF;
    
    IF NOT space_admin THEN
        RAISE EXCEPTION 'User is not authorized to reject this recipe';
    END IF;
    
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
