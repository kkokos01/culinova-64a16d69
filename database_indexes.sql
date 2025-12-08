-- Performance indexes for recipes table
-- Run these in your Supabase SQL Editor

-- Make filtering by space lightning fast
CREATE INDEX IF NOT EXISTS idx_recipes_space_id ON public.recipes(space_id);

-- Make sorting by date lightning fast
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);

-- Composite index for the specific query your collection page uses
CREATE INDEX IF NOT EXISTS idx_recipes_space_created ON public.recipes(space_id, created_at DESC);

-- Additional useful indexes for user filtering
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_user_created ON public.recipes(user_id, created_at DESC);

-- Index for public recipes
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON public.recipes(is_public);
