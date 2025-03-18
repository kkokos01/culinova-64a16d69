
import { supabase } from "@/integrations/supabase/client";
import { RecipeVersion } from "@/context/recipe/types";
import { isValidUUID, constructVersionObject } from "../utils/versionUtils";

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
