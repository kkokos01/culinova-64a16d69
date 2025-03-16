
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// This utility function helps inspect Supabase database data
export const useDebugSupabaseData = () => {
  const { toast } = useToast();

  // Inspect a single recipe with its details
  const inspectRecipe = async (recipeId: string) => {
    try {
      console.log("Inspecting recipe data structure:", recipeId);

      // Get the recipe basic info
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (recipeError) {
        throw new Error(`Failed to fetch recipe: ${recipeError.message}`);
      }

      console.log("Recipe base data:", recipe);

      // Get ingredients
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select(`
          *,
          food:food_id(id, name, description, category_id),
          unit:unit_id(id, name, abbreviation, plural_name)
        `)
        .eq('recipe_id', recipeId);

      if (ingredientsError) {
        throw new Error(`Failed to fetch ingredients: ${ingredientsError.message}`);
      }

      console.log("Ingredients data:", ingredients);

      // Get steps
      const { data: steps, error: stepsError } = await supabase
        .from('steps')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('order_number');

      if (stepsError) {
        throw new Error(`Failed to fetch steps: ${stepsError.message}`);
      }

      console.log("Steps data:", steps);

      // Check the recipe function's output
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_recipe_with_details', { recipe_id_param: recipeId });
        
      if (rpcError) {
        throw new Error(`Failed to fetch recipe via RPC: ${rpcError.message}`);
      }

      console.log("RPC function output:", rpcData);

      return {
        recipe,
        ingredients,
        steps,
        rpcData
      };
    } catch (err) {
      console.error("Error during database inspection:", err);
      toast({
        title: "Error inspecting database",
        description: err instanceof Error ? err.message : "Failed to inspect database data",
        variant: "destructive"
      });
      return null;
    }
  };

  // Get all foods available in the database
  const getAllFoods = async () => {
    try {
      const { data: foods, error } = await supabase
        .from('foods')
        .select('*')
        .order('name');
        
      if (error) {
        throw new Error(`Failed to fetch foods: ${error.message}`);
      }
      
      console.log("All available foods:", foods);
      return foods;
    } catch (err) {
      console.error("Error fetching foods:", err);
      toast({
        title: "Error fetching foods",
        description: err instanceof Error ? err.message : "Failed to fetch foods data",
        variant: "destructive"
      });
      return null;
    }
  };

  // Get all units available in the database
  const getAllUnits = async () => {
    try {
      const { data: units, error } = await supabase
        .from('units')
        .select('*')
        .order('display_order');
        
      if (error) {
        throw new Error(`Failed to fetch units: ${error.message}`);
      }
      
      console.log("All available units:", units);
      return units;
    } catch (err) {
      console.error("Error fetching units:", err);
      toast({
        title: "Error fetching units",
        description: err instanceof Error ? err.message : "Failed to fetch units data",
        variant: "destructive"
      });
      return null;
    }
  };

  // Analyze database structure for recipe-related tables
  const analyzeRecipeStructure = async () => {
    try {
      console.log("Analyzing recipe database structure...");
      
      // Get count of recipes
      const { count: recipeCount, error: recipeError } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true });
        
      if (recipeError) throw new Error(`Recipe count error: ${recipeError.message}`);
      
      // Get count of foods
      const { count: foodCount, error: foodError } = await supabase
        .from('foods')
        .select('*', { count: 'exact', head: true });
        
      if (foodError) throw new Error(`Food count error: ${foodError.message}`);
      
      // Get count of units
      const { count: unitCount, error: unitError } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true });
        
      if (unitError) throw new Error(`Unit count error: ${unitError.message}`);
      
      // Get ingredients sample
      const { data: ingredientsSample, error: ingredientsError } = await supabase
        .from('ingredients')
        .select(`
          *,
          food:food_id(id, name),
          unit:unit_id(id, name, abbreviation)
        `)
        .limit(10);
        
      if (ingredientsError) throw new Error(`Ingredients error: ${ingredientsError.message}`);
      
      // Get a sample of available recipes
      const { data: recipes, error: recipesListError } = await supabase
        .from('recipes')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (recipesListError) throw new Error(`Recipes list error: ${recipesListError.message}`);
      
      const analysisResults = {
        recipeCount,
        foodCount,
        unitCount,
        ingredientsSample,
        recentRecipes: recipes
      };
      
      console.log("Database analysis results:", analysisResults);
      return analysisResults;
    } catch (err) {
      console.error("Error analyzing database:", err);
      toast({
        title: "Error analyzing database",
        description: err instanceof Error ? err.message : "Failed to analyze database structure",
        variant: "destructive"
      });
      return null;
    }
  };

  // Find the new Tikka Masala recipe in the database
  const findTikkaMasalaRecipe = async () => {
    try {
      // Find recipes with "Tikka Masala" in the title
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('*')
        .ilike('title', '%Tikka Masala%')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(`Failed to search for Tikka Masala recipes: ${error.message}`);
      }
      
      console.log("Found Tikka Masala recipes:", recipes);
      
      if (recipes && recipes.length > 0) {
        // Inspect the most recently created matching recipe
        const mostRecent = recipes[0];
        console.log("Most recent Tikka Masala recipe:", mostRecent);
        
        // Get the full details
        const details = await inspectRecipe(mostRecent.id);
        return { 
          recipe: mostRecent,
          details
        };
      } else {
        console.log("No Tikka Masala recipes found");
        return null;
      }
    } catch (err) {
      console.error("Error finding Tikka Masala recipe:", err);
      toast({
        title: "Error finding recipe",
        description: err instanceof Error ? err.message : "Failed to find Tikka Masala recipe",
        variant: "destructive"
      });
      return null;
    }
  };

  return { 
    inspectRecipe,
    getAllFoods,
    getAllUnits,
    analyzeRecipeStructure,
    findTikkaMasalaRecipe
  };
};
