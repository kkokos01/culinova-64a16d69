
import { supabase } from "@/integrations/supabase/client";
import { Recipe } from "@/types";
import { RecipeVersion } from "@/context/recipe/types";

// Fetch versions from the database for a specific recipe
export async function fetchRecipeVersions(recipeId: string): Promise<RecipeVersion[]> {
  if (!recipeId) {
    throw new Error("Recipe ID is required");
  }
  
  // First fetch the original recipe to ensure we have all details
  const { data: recipeData, error: recipeError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single();
  
  if (recipeError) throw recipeError;
  
  if (!recipeData) {
    throw new Error("Recipe not found");
  }
  
  // Get versions for this recipe
  const { data: dbVersions, error } = await supabase
    .from('recipe_versions')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('version_number', { ascending: true });
  
  if (error) throw error;
  
  if (!dbVersions || dbVersions.length === 0) {
    return [];
  }
  
  // Convert to our frontend version format
  const versions: RecipeVersion[] = await Promise.all(dbVersions.map(async (dbVersion) => {
    // Fetch ingredients for this version
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('recipe_version_ingredients')
      .select(`
        id, amount, order_index,
        food:food_id(id, name, description, category_id, properties),
        unit:unit_id(id, name, abbreviation, plural_name)
      `)
      .eq('version_id', dbVersion.id);
    
    if (ingredientsError) throw ingredientsError;
    
    // Fetch steps for this version
    const { data: steps, error: stepsError } = await supabase
      .from('recipe_version_steps')
      .select('*')
      .eq('version_id', dbVersion.id)
      .order('order_number', { ascending: true });
    
    if (stepsError) throw stepsError;
    
    // Create recipe object for this version - using original recipe data as the base
    const versionRecipe: Recipe = {
      ...recipeData,
      ingredients: ingredients?.map(ing => {
        // Handle food and unit as objects with proper type checking
        const food = ing.food as unknown as { id: string, name: string, description: string, category_id: string, properties: any } | null;
        const unit = ing.unit as unknown as { id: string, name: string, abbreviation: string, plural_name: string } | null;
        
        return {
          id: ing.id,
          food_id: food?.id || '',
          unit_id: unit?.id || '',
          amount: ing.amount,
          food: food || undefined,
          unit: unit || undefined
        };
      }) || [],
      steps: steps || []
    };
    
    return {
      id: dbVersion.id,
      name: dbVersion.display_name,
      recipe: versionRecipe,
      isActive: dbVersion.is_current
    };
  }));
  
  return versions;
}

// Create a new recipe version
export async function createRecipeVersion(name: string, recipe: Recipe, userId: string): Promise<RecipeVersion> {
  if (!recipe || !recipe.id) {
    throw new Error("Cannot create version: Recipe is undefined or missing ID");
  }

  // Create new version in the database
  const { data: newDbVersion, error } = await supabase
    .from('recipe_versions')
    .insert({
      recipe_id: recipe.id,
      version_number: 1, // This will be updated after we check existing versions
      display_name: name,
      modification_type: 'manual',
      is_current: true,
      created_by: userId || recipe.user_id
    })
    .select()
    .single();
  
  if (error) throw error;
  
  if (!newDbVersion) {
    throw new Error("Failed to create new version");
  }
  
  // Create ingredients for the new version
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    const versionIngredients = recipe.ingredients.map((ing, index) => ({
      version_id: newDbVersion.id,
      food_id: ing.food?.id || ing.food_id || '',
      unit_id: ing.unit?.id || ing.unit_id || '',
      amount: ing.amount,
      order_index: index
    }));
    
    const { error: ingredientsError } = await supabase
      .from('recipe_version_ingredients')
      .insert(versionIngredients);
    
    if (ingredientsError) throw ingredientsError;
  }
  
  // Create steps for the new version
  if (recipe.steps && recipe.steps.length > 0) {
    const versionSteps = recipe.steps.map(step => ({
      version_id: newDbVersion.id,
      order_number: step.order_number,
      instruction: step.instruction,
      duration_minutes: step.duration_minutes
    }));
    
    const { error: stepsError } = await supabase
      .from('recipe_version_steps')
      .insert(versionSteps);
    
    if (stepsError) throw stepsError;
  }
  
  // Deactivate all other versions
  await supabase
    .from('recipe_versions')
    .update({ is_current: false })
    .eq('recipe_id', recipe.id)
    .neq('id', newDbVersion.id);
  
  // Create the new version object
  const newVersion: RecipeVersion = {
    id: newDbVersion.id,
    name: newDbVersion.display_name,
    recipe: recipe,
    isActive: true
  };
  
  return newVersion;
}

// Set active version
export async function setVersionActive(versionId: string, recipeId: string): Promise<void> {
  // Update database first
  const { error } = await supabase
    .from('recipe_versions')
    .update({ is_current: true })
    .eq('id', versionId);
  
  if (error) throw error;
  
  // Deactivate other versions in the database
  const { error: otherVersionsError } = await supabase
    .from('recipe_versions')
    .update({ is_current: false })
    .eq('recipe_id', recipeId)
    .neq('id', versionId);
  
  if (otherVersionsError) throw otherVersionsError;
}

// Rename version
export async function renameVersion(versionId: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('recipe_versions')
    .update({ display_name: newName })
    .eq('id', versionId);
  
  if (error) throw error;
}

// Delete version
export async function deleteVersion(versionId: string): Promise<void> {
  const { error } = await supabase
    .from('recipe_versions')
    .delete()
    .eq('id', versionId);
  
  if (error) throw error;
}
