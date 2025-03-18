
import { supabase } from "@/integrations/supabase/client";
import { Recipe } from "@/types";
import { RecipeVersion } from "@/context/recipe/types";
import { isValidUUID, generateMockId } from "../utils/versionUtils";

// Create a new recipe version
export async function createRecipeVersion(name: string, recipe: Recipe, userId: string): Promise<RecipeVersion> {
  if (!recipe || !recipe.id) {
    throw new Error("Cannot create version: Recipe is undefined or missing ID");
  }

  // Check if we're using a mock recipe or user ID
  if (!isValidUUID(recipe.id) || !isValidUUID(userId)) {
    console.log("Using mock data, returning mock version");
    // Return a mock version with the same recipe
    return {
      id: generateMockId(),
      name: name,
      recipe: recipe,
      isActive: true
    };
  }

  try {
    // Create new version in the database
    const { data: newDbVersion, error } = await supabase
      .from('recipe_versions')
      .insert({
        recipe_id: recipe.id,
        version_number: 1, // This will be updated after we check existing versions
        display_name: name,
        modification_type: 'manual',
        is_current: true,
        created_by: userId
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
  } catch (error) {
    console.error("Error in createRecipeVersion:", error);
    throw error;
  }
}
