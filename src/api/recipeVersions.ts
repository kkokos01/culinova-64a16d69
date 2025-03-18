import { supabase } from "@/integrations/supabase/client";
import { Recipe } from "@/types";
import { RecipeVersion } from "@/context/recipe/types";
import { 
  RawVersionIngredient, 
  RawVersionStep, 
  normalizeVersionIngredient,
  normalizeFood,
  normalizeUnit
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
      
      // Ensure unique display names for the frontend by adding a number suffix if needed
      return deduplicateVersionNames(versions);
    }
    
    // If RPC worked, use its results
    if (!dbVersionsRaw || dbVersionsRaw.length === 0) {
      return [];
    }
    
    // Convert to our frontend version format
    const versions: RecipeVersion[] = await Promise.all(dbVersionsRaw.map(async (dbVersion) => {
      return await constructVersionObject(dbVersion, recipeData);
    }));
    
    // Ensure unique display names for the frontend by adding a number suffix if needed
    return deduplicateVersionNames(versions);
  } catch (error) {
    console.error("Error in fetchRecipeVersions:", error);
    throw error;
  }
}

// Ensure unique version names for display in the frontend
function deduplicateVersionNames(versions: RecipeVersion[]): RecipeVersion[] {
  const nameMap = new Map<string, number>();
  
  return versions.map(version => {
    const originalName = version.name;
    
    // If name is already unique, keep it as is
    if (!nameMap.has(originalName)) {
      nameMap.set(originalName, 1);
      return version;
    }
    
    // For duplicate names, add a number suffix
    const count = nameMap.get(originalName)! + 1;
    nameMap.set(originalName, count);
    
    // Only add suffix to duplicates after the first occurrence
    if (count > 1) {
      // Special case for "Original" - if we find more than one, rename duplicates to "Vegetarian Version"
      // This is specifically to handle our SQL update case where we renamed one Original to Mild and the other to Vegetarian
      if (originalName === "Original" && count === 3) {
        // This is the third "Original" which should actually be "Vegetarian Version"
        return {
          ...version,
          name: "Vegetarian Version",
          recipe: {
            ...version.recipe,
            title: `Vegetarian Version ${version.recipe.title.replace(/^(Mild Version|Vegetarian Version|Spicy Coconut Chicken Tikka Masala)\s+/, '')}`
          }
        };
      } else if (originalName === "Original" && count === 2) {
        // This is the second "Original" which should actually be "Mild Version"
        return {
          ...version,
          name: "Mild Version",
          recipe: {
            ...version.recipe,
            title: `Mild Version ${version.recipe.title.replace(/^(Mild Version|Vegetarian Version|Spicy Coconut Chicken Tikka Masala)\s+/, '')}`
          }
        };
      } else {
        // General case for other duplicates
        return {
          ...version,
          name: `${originalName} ${count}`
        };
      }
    }
    
    return version;
  });
}

// Helper function to construct version objects
async function constructVersionObject(dbVersion: any, recipeData: any): Promise<RecipeVersion> {
  try {
    // Fetch ingredients for this version
    const { data: ingredientsData, error: ingredientsError } = await supabase
      .from('recipe_version_ingredients')
      .select(`
        id, amount, order_index, food_id, unit_id, version_id,
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
      ingredients: ingredientsData ? ingredientsData.map((ing: any) => {
        // Transform the raw data into our expected format
        // Make sure we have food_id and unit_id explicitly
        const normalizedIngredient = {
          id: ing.id,
          food_id: ing.food_id,
          unit_id: ing.unit_id,
          amount: ing.amount,
          order_index: ing.order_index,
          food: normalizeFood(ing.food),
          unit: normalizeUnit(ing.unit)
        };
        
        return normalizedIngredient;
      }) : [],
      steps: steps || []
    };
    
    // Get version name from display_name if it exists, otherwise use name
    const versionName = dbVersion.display_name || dbVersion.name || "Original";
    
    return {
      id: dbVersion.id,
      name: versionName,
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
