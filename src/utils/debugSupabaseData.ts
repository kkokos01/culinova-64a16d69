
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// This utility function helps inspect Supabase database data
export const useDebugSupabaseData = () => {
  const { toast } = useToast();

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

  return { inspectRecipe };
};
