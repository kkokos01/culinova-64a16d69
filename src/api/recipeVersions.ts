import { supabase } from "@/integrations/supabase/client";
import { Recipe } from "@/types";
import { RecipeVersion } from "@/context/recipe/types";
import { 
  RawVersionIngredient, 
  RawVersionStep, 
  normalizeVersionIngredient 
} from "./types/supabaseTypes";

// Fetch versions from the database for a specific recipe
export async function fetchRecipeVersions(recipeId: string): Promise<RecipeVersion[]> {
  if (!recipeId) {
    throw new Error("Recipe ID is required");
  }
  
  // Check if we're using a mock recipe (non-UUID format)
  if (!isValidUUID(recipeId)) {
    console.log("Using mock recipe ID, returning empty versions array");
    return [];
  }
  
  try {
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
    
    // Use database function to avoid ambiguous column references
    const { data: dbVersionsRaw, error } = await supabase
      .rpc('get_recipe_versions', { recipe_id_param: recipeId });
    
    if (error) {
      console.error("Error using RPC, falling back to direct query:", error);
      
      // Fallback to direct query with proper table aliases
      const { data: dbVersions, error: queryError } = await supabase
        .from('recipe_versions')
        .select('id, display_name, version_number, is_current, created_at, modification_type')
        .eq('recipe_id', recipeId)
        .order('version_number', { ascending: true });
      
      if (queryError) throw queryError;
      
      if (!dbVersions || dbVersions.length === 0) {
        return [];
      }
      
      // Convert to our frontend version format using the fallback query results
      const versions: RecipeVersion[] = await Promise.all(dbVersions.map(async (dbVersion) => {
        return await constructVersionObject(dbVersion, recipeData);
      }));
      
      return versions;
    }
    
    // If RPC worked, use its results
    if (!dbVersionsRaw || dbVersionsRaw.length === 0) {
      return [];
    }
    
    // Convert to our frontend version format
    const versions: RecipeVersion[] = await Promise.all(dbVersionsRaw.map(async (dbVersion) => {
      return await constructVersionObject(dbVersion, recipeData);
    }));
    
    return versions;
  } catch (error) {
    console.error("Error in fetchRecipeVersions:", error);
    throw error;
  }
}

// Helper function to construct version objects
async function constructVersionObject(dbVersion: any, recipeData: any): Promise<RecipeVersion> {
  try {
    // Fetch ingredients for this version
    const { data: ingredientsData, error: ingredientsError } = await supabase
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
      ingredients: ingredientsData ? ingredientsData.map((ing: RawVersionIngredient) => {
        // Use our normalization function to handle both array and object cases
        const normalizedIngredient = normalizeVersionIngredient(ing);
        
        return {
          id: normalizedIngredient.id,
          food_id: normalizedIngredient.food_id,
          unit_id: normalizedIngredient.unit_id,
          amount: normalizedIngredient.amount,
          food: normalizedIngredient.food,
          unit: normalizedIngredient.unit
        };
      }) : [],
      steps: steps || []
    };
    
    return {
      id: dbVersion.id,
      name: dbVersion.display_name || dbVersion.name,
      recipe: versionRecipe,
      isActive: dbVersion.is_current || dbVersion.is_active
    };
  } catch (error) {
    console.error("Error constructing version object:", error);
    throw error;
  }
}

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

// Set active version
export async function setVersionActive(versionId: string, recipeId: string): Promise<void> {
  // Check if we're using mock IDs
  if (!isValidUUID(versionId) || !isValidUUID(recipeId)) {
    console.log("Using mock IDs, skipping database update");
    return;
  }
  
  try {
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
  } catch (error) {
    console.error("Error in setVersionActive:", error);
    throw error;
  }
}

// Rename version
export async function renameVersion(versionId: string, newName: string): Promise<void> {
  // Check if we're using a mock ID
  if (!isValidUUID(versionId)) {
    console.log("Using mock ID, skipping database update");
    return;
  }
  
  try {
    const { error } = await supabase
      .from('recipe_versions')
      .update({ display_name: newName })
      .eq('id', versionId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error in renameVersion:", error);
    throw error;
  }
}

// Delete version
export async function deleteVersion(versionId: string): Promise<void> {
  // Check if we're using a mock ID
  if (!isValidUUID(versionId)) {
    console.log("Using mock ID, skipping database delete");
    return;
  }
  
  try {
    const { error } = await supabase
      .from('recipe_versions')
      .delete()
      .eq('id', versionId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error in deleteVersion:", error);
    throw error;
  }
}

// Helper function to check if a string is a valid UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Generate a mock ID (not for database use)
function generateMockId(): string {
  return 'mock-' + Math.random().toString(36).substring(2, 15);
}
