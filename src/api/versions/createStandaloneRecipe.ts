import { supabase } from "@/integrations/supabase/client";
import { Recipe } from "@/types";
import { isValidUUID } from "../utils/versionUtils";

// Create a standalone recipe from a modified version
export async function createStandaloneRecipeFromVersion(
  recipe: Recipe, 
  userId: string, 
  parentRecipeId?: string
): Promise<Recipe> {
  if (!recipe || !recipe.title) {
    throw new Error("Cannot create standalone recipe: Invalid recipe data");
  }

  // Check if we're using a mock recipe or user ID
  if (!isValidUUID(userId)) {
    console.log("Using mock data, returning mock recipe");
    return {
      ...recipe,
      id: `standalone-${Date.now()}`,
      user_id: userId
    };
  }

  try {
    // Create new standalone recipe in the database
    const { data: newRecipe, error } = await supabase
      .from('recipes')
      .insert({
        title: recipe.title,
        description: recipe.description,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        user_id: userId,
        space_id: recipe.space_id || null,
        // parent_recipe_id: parentRecipeId || null, // TODO: Add after migration
        image_url: recipe.image_url || null,
        // tags: recipe.tags || [], // TODO: Add after checking schema
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any) // Type assertion to bypass TypeScript errors temporarily
      .select()
      .single();
    
    if (error) throw error;
    
    if (!newRecipe) {
      throw new Error("Failed to create standalone recipe");
    }

    // Create ingredients for the new standalone recipe
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      const recipeIngredients = recipe.ingredients.map((ing, index) => ({
        recipe_id: newRecipe.id,
        food_id: ing.food?.id || ing.food_id || null,
        food_name: ing.food_name || ing.food?.name || '',
        unit_id: ing.unit?.id || ing.unit_id || null,
        unit_name: ing.unit_name || ing.unit?.name || '',
        amount: ing.amount,
        order_index: index
      }));
      
      const { error: ingredientsError } = await supabase
        .from('ingredients')
        .insert(recipeIngredients as any); // Type assertion to bypass TypeScript errors
      
      if (ingredientsError) throw ingredientsError;
    }
    
    // Create steps for the new standalone recipe
    if (recipe.steps && recipe.steps.length > 0) {
      const recipeSteps = recipe.steps.map(step => ({
        recipe_id: newRecipe.id,
        order_number: step.order_number,
        instruction: step.instruction,
        duration_minutes: step.duration_minutes || null
      }));
      
      const { error: stepsError } = await supabase
        .from('steps')
        .insert(recipeSteps as any); // Type assertion to bypass TypeScript errors
      
      if (stepsError) throw stepsError;
    }
    
    // Return the complete standalone recipe
    return {
      ...recipe,
      id: newRecipe.id,
      user_id: newRecipe.user_id,
      space_id: newRecipe.space_id,
      // parent_recipe_id: newRecipe.parent_recipe_id, // TODO: Add after migration
      created_at: newRecipe.created_at,
      updated_at: newRecipe.updated_at
    } as Recipe; // Type assertion to bypass TypeScript errors
  } catch (error) {
    console.error("Error in createStandaloneRecipeFromVersion:", error);
    throw error;
  }
}
