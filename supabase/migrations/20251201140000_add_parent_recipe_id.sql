-- Add parent_recipe_id column to recipes table
-- This allows saved modifications to appear as standalone recipes
-- while maintaining lineage to the original recipe

ALTER TABLE recipes 
ADD COLUMN parent_recipe_id UUID REFERENCES recipes(id);

-- Add index for performance
CREATE INDEX idx_recipes_parent_recipe_id ON recipes(parent_recipe_id);

-- Add comment for documentation
COMMENT ON COLUMN recipes.parent_recipe_id IS 'References the original recipe this was derived from (for saved modifications)';
