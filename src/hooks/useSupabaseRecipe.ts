
import { useState, useEffect } from "react";
import { Recipe } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useSupabaseRecipe = (recipeId: string) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        
        // Fetch recipe data from Supabase
        console.log("Fetching recipe from Supabase:", recipeId);
        const { data, error } = await supabase
          .rpc('get_recipe_with_details', { recipe_id_param: recipeId })
          .select();
          
        if (error) {
          throw new Error(`Failed to fetch recipe: ${error.message}`);
        }

        if (!data || data.length === 0) {
          console.log("No recipe found with ID:", recipeId);
          setRecipe(null);
          setLoading(false);
          return;
        }
        
        // Process the raw data into our Recipe format
        const processedRecipe = processRecipeData(data);
        console.log("Processed recipe:", processedRecipe);
        
        setRecipe(processedRecipe);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch recipe"));
        setLoading(false);
        
        toast({
          title: "Error loading recipe",
          description: err instanceof Error ? err.message : "Failed to fetch recipe",
          variant: "destructive"
        });
      }
    };

    if (recipeId) {
      fetchRecipe();
    } else {
      setLoading(false);
    }
  }, [recipeId, toast]);

  // Process the flat RPC response into a structured Recipe object
  const processRecipeData = (data: any[]): Recipe => {
    if (!data || data.length === 0) return null;
    
    // Get basic recipe data from the first row
    const recipeBase = {
      id: data[0].id,
      title: data[0].title,
      description: data[0].description,
      prep_time_minutes: data[0].prep_time_minutes,
      cook_time_minutes: data[0].cook_time_minutes,
      servings: data[0].servings,
      difficulty: data[0].difficulty,
      user_id: data[0].user_id,
      space_id: data[0].space_id,
      is_public: data[0].is_public,
      privacy_level: data[0].privacy_level,
      image_url: data[0].image_url,
      created_at: data[0].created_at,
      updated_at: data[0].updated_at,
      ingredients: [],
      steps: []
    };
    
    // Process ingredients (deduplicate by id)
    const ingredientsMap = new Map();
    data.forEach(row => {
      if (row.ingredient_id && !ingredientsMap.has(row.ingredient_id)) {
        ingredientsMap.set(row.ingredient_id, {
          id: row.ingredient_id,
          food_id: row.ingredient_food_id,
          unit_id: row.ingredient_unit_id,
          amount: row.ingredient_amount,
          food: {
            id: row.ingredient_food_id,
            name: row.food_name,
            description: row.food_description,
            category_id: row.food_category_id,
            properties: row.food_properties,
          },
          unit: {
            id: row.ingredient_unit_id,
            name: row.unit_name,
            abbreviation: row.unit_abbreviation,
            plural_name: row.unit_plural_name,
          }
        });
      }
    });
    recipeBase.ingredients = Array.from(ingredientsMap.values());
    
    // Process steps (deduplicate by id)
    const stepsMap = new Map();
    data.forEach(row => {
      if (row.step_id && !stepsMap.has(row.step_id)) {
        stepsMap.set(row.step_id, {
          id: row.step_id,
          recipe_id: recipeBase.id,
          instruction: row.step_instruction,
          order_number: row.step_order_number,
          duration_minutes: row.step_duration_minutes,
        });
      }
    });
    recipeBase.steps = Array.from(stepsMap.values());
    
    // Sort steps by order_number
    recipeBase.steps.sort((a, b) => a.order_number - b.order_number);
    
    return recipeBase;
  };

  return { recipe, loading, error };
};
