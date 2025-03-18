
import { Recipe } from "@/types";
import { RecipeVersion } from "@/context/recipe/types";
import { supabase } from "@/integrations/supabase/client";

// Helper function to check if a string is a valid UUID
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Generate a mock ID (not for database use)
export function generateMockId(): string {
  return 'mock-' + Math.random().toString(36).substring(2, 15);
}

// Helper function to construct version objects
export async function constructVersionObject(dbVersion: any, recipeData: any): Promise<RecipeVersion> {
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

// These functions are imported from @/api/types/supabaseTypes
// We re-export them here to simplify imports in other files
import { normalizeFood, normalizeUnit } from "@/api/types/supabaseTypes";
export { normalizeFood, normalizeUnit };
