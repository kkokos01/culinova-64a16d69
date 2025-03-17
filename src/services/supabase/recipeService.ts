
import { supabase } from "@/integrations/supabase/client";
import { Recipe, Ingredient } from "@/types";
import { useToast } from "@/hooks/use-toast";

/**
 * Helper function to normalize food and unit data from Supabase
 * to handle both array and object forms consistently
 */
const normalizeIngredient = (ingredient: any): Ingredient => {
  // Handle food property - can be array or object
  if (ingredient.food && Array.isArray(ingredient.food)) {
    ingredient.food = ingredient.food[0] || null;
  }
  
  // Handle unit property - can be array or object
  if (ingredient.unit && Array.isArray(ingredient.unit)) {
    ingredient.unit = ingredient.unit[0] || null;
  }
  
  return ingredient as Ingredient;
};

/**
 * Service for handling recipe-related Supabase queries
 * Ensures consistent naming conventions for joined tables
 */
export const recipeService = {
  /**
   * Fetch a recipe with all its details using proper singular naming
   * for joined relations
   */
  async getRecipe(recipeId: string): Promise<Recipe | null> {
    try {
      if (!recipeId) {
        console.warn("No recipe ID provided to recipeService.getRecipe");
        return null;
      }
      
      console.log("Fetching recipe from service:", recipeId);
      
      // Fetch basic recipe data
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();
        
      if (recipeError) {
        throw new Error(`Failed to fetch recipe: ${recipeError.message}`);
      }
      
      if (!recipeData) {
        console.log("No recipe found with ID:", recipeId);
        return null;
      }
      
      // Fetch ingredients with CORRECT SINGULAR naming for joined tables
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select(`
          id, 
          recipe_id,
          food_id,
          unit_id,
          amount,
          order_index,
          food:food_id(id, name, description, is_validated, confidence_score, source),
          unit:unit_id(id, name, abbreviation)
        `)
        .eq('recipe_id', recipeId);
        
      if (ingredientsError) {
        throw new Error(`Failed to fetch ingredients: ${ingredientsError.message}`);
      }
      
      // Fetch steps
      const { data: steps, error: stepsError } = await supabase
        .from('steps')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('order_number');
        
      if (stepsError) {
        throw new Error(`Failed to fetch steps: ${stepsError.message}`);
      }
      
      // Log what we found
      console.log("Recipe service found:", {
        recipeData,
        ingredientsCount: ingredientsData?.length || 0,
        stepsCount: steps?.length || 0,
      });
      
      // Normalize ingredients to handle array/object inconsistency
      const normalizedIngredients = ingredientsData ? 
        ingredientsData.map(ingredient => normalizeIngredient(ingredient)) : 
        [];
      
      // Combine into recipe object with correct structure
      const completeRecipe: Recipe = {
        ...recipeData,
        ingredients: normalizedIngredients,
        steps: steps || []
      };
      
      return completeRecipe;
    } catch (error) {
      console.error("Error in recipeService.getRecipe:", error);
      throw error;
    }
  },
  
  /**
   * Fetch multiple recipes with filtering options
   */
  async getRecipes(options: {
    userId?: string;
    spaceId?: string;
    isPublic?: boolean;
  } = {}): Promise<Recipe[]> {
    try {
      console.log("Fetching recipes with options:", options);
      
      // Start building the query
      let query = supabase
        .from('recipes')
        .select('*');
      
      // Apply filtering based on options
      if (options.spaceId) {
        query = query.eq('space_id', options.spaceId);
      } else if (options.userId) {
        query = query.eq('user_id', options.userId);
      } else if (options.isPublic) {
        query = query.eq('is_public', true);
      }
      
      // Execute the query
      const { data, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch recipes: ${error.message}`);
      }
      
      // Basic validation and filtering
      const validRecipes = data ? data.filter(recipe => 
        recipe && recipe.id && recipe.title
      ) : [];
      
      // Initialize empty arrays for recipes without them
      const processedRecipes = validRecipes.map(recipe => ({
        ...recipe,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || []
      }));
      
      return processedRecipes as Recipe[];
    } catch (error) {
      console.error("Error in recipeService.getRecipes:", error);
      throw error;
    }
  },
  
  /**
   * Search for a recipe by name
   */
  async findRecipeByName(searchTerm: string): Promise<Recipe | null> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title')
        .ilike('title', `%${searchTerm}%`)
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        return this.getRecipe(data[0].id);
      }
      
      return null;
    } catch (error) {
      console.error("Error in recipeService.findRecipeByName:", error);
      throw error;
    }
  }
};
