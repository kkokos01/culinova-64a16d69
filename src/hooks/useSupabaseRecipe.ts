
import { useState, useEffect } from "react";
import { Recipe, Ingredient, Step } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMockRecipe } from "@/hooks/useMockRecipe";

/**
 * Custom hook to fetch recipe data from Supabase
 * Falls back to mock data if the ID is not a valid UUID
 */
export const useSupabaseRecipe = (recipeId: string) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Regular expression to validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // Get mock recipe data for non-UUID IDs (for development)
  const { recipe: mockRecipe, loading: mockLoading } = useMockRecipe(recipeId);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);

        // Check if we're dealing with a valid UUID
        if (!uuidRegex.test(recipeId)) {
          console.log("Not a valid UUID, using mock data:", recipeId);
          if (mockRecipe) {
            setRecipe(mockRecipe);
          }
          setLoading(false);
          return;
        }

        // First try to use the database function if it exists
        try {
          const { data: recipeDetailsData, error: fnError } = await supabase
            .rpc('get_recipe_with_details', { recipe_id_param: recipeId });
          
          if (!fnError && recipeDetailsData && recipeDetailsData.length > 0) {
            // Process the data from our custom RPC function
            const recipeBase = {
              id: recipeDetailsData[0].id,
              title: recipeDetailsData[0].title,
              description: recipeDetailsData[0].description,
              cook_time_minutes: recipeDetailsData[0].cook_time_minutes,
              prep_time_minutes: recipeDetailsData[0].prep_time_minutes,
              servings: recipeDetailsData[0].servings,
              difficulty: recipeDetailsData[0].difficulty,
              user_id: recipeDetailsData[0].user_id,
              is_public: recipeDetailsData[0].is_public,
              privacy_level: recipeDetailsData[0].privacy_level,
              image_url: recipeDetailsData[0].image_url,
              created_at: recipeDetailsData[0].created_at,
              updated_at: recipeDetailsData[0].updated_at
            };

            // Process ingredients
            const ingredients: Ingredient[] = recipeDetailsData
              .filter(row => row.ingredient_id)
              .map(row => ({
                id: row.ingredient_id,
                food_id: row.ingredient_food_id,
                unit_id: row.ingredient_unit_id, 
                amount: row.ingredient_amount,
                food: row.food_name ? {
                  id: row.ingredient_food_id,
                  name: row.food_name,
                  description: row.food_description,
                  category_id: row.food_category_id,
                  properties: row.food_properties
                } : undefined,
                unit: row.unit_name ? {
                  id: row.ingredient_unit_id,
                  name: row.unit_name,
                  abbreviation: row.unit_abbreviation,
                  plural_name: row.unit_plural_name
                } : undefined
              }));

            // Process steps
            const steps = recipeDetailsData
              .filter(row => row.step_id)
              .map(row => ({
                id: row.step_id,
                recipe_id: recipeId,
                order_number: row.step_order_number,
                instruction: row.step_instruction,
                duration_minutes: row.step_duration_minutes
              }));

            // Create the complete recipe object
            const completeRecipe: Recipe = {
              ...recipeBase,
              ingredients,
              steps
            };

            setRecipe(completeRecipe);
            setLoading(false);
            return;
          }
        } catch (rpcError) {
          // Just log the error and fall back to manual queries
          console.log("RPC function failed, falling back to manual queries:", rpcError);
        }

        // Fallback to previous approach with improved table aliases
        // Fetch the recipe
        const { data: recipeData, error: recipeError } = await supabase
          .from("recipes")
          .select("*")
          .eq("id", recipeId)
          .single();

        if (recipeError) throw recipeError;
        if (!recipeData) throw new Error("Recipe not found");

        // Fetch ingredients with their food and unit details
        // Use explicit table aliases to avoid ambiguous column references
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from("ingredients as i")
          .select(`
            i.id, i.amount, i.order_index,
            food:foods!i.food_id(id, name, description, category_id, properties),
            unit:units!i.unit_id(id, name, abbreviation, plural_name)
          `)
          .eq("i.recipe_id", recipeId)
          .order("i.order_index", { ascending: true });

        if (ingredientsError) throw ingredientsError;

        // Fetch steps
        const { data: stepsData, error: stepsError } = await supabase
          .from("steps as s")
          .select("s.id, s.order_number, s.instruction, s.duration_minutes")
          .eq("s.recipe_id", recipeId)
          .order("s.order_number", { ascending: true });

        if (stepsError) throw stepsError;

        // Transform ingredients data to match our expected format
        const ingredients: Ingredient[] = [];
        
        if (ingredientsData) {
          for (const ing of ingredientsData) {
            // Safely handle food and unit objects with type checking
            const ingredientFood = ing.food && typeof ing.food === 'object' ? ing.food : null;
            const ingredientUnit = ing.unit && typeof ing.unit === 'object' ? ing.unit : null;
            
            ingredients.push({
              id: ing.id || '',
              food_id: ingredientFood ? ingredientFood.id || '' : '',
              unit_id: ingredientUnit ? ingredientUnit.id || '' : '',
              amount: ing.amount || 0,
              food: ingredientFood || undefined,
              unit: ingredientUnit || undefined
            });
          }
        }

        // Construct the complete recipe object
        const completeRecipe: Recipe = {
          ...recipeData,
          ingredients: ingredients,
          steps: stepsData || []
        };

        setRecipe(completeRecipe);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching recipe:", err);
        
        // If we failed to fetch from Supabase but have mock data, use that instead
        if (!uuidRegex.test(recipeId) && mockRecipe) {
          console.log("Falling back to mock data");
          setRecipe(mockRecipe);
          setLoading(false);
          return;
        }
        
        setError(err instanceof Error ? err : new Error("Failed to fetch recipe"));
        setLoading(false);
        
        toast({
          title: "Error loading recipe",
          description: err instanceof Error ? err.message : "Failed to fetch recipe",
          variant: "destructive"
        });
      }
    };

    fetchRecipe();
  }, [recipeId, toast, mockRecipe]);

  return { recipe, loading, error };
};
