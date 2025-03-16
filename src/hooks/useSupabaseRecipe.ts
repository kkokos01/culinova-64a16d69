
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
          .from("ingredients")
          .select(`
            id, amount, order_index,
            food:food_id(id, name, description, category_id, properties),
            unit:unit_id(id, name, abbreviation, plural_name)
          `)
          .eq("recipe_id", recipeId)
          .order("order_index", { ascending: true });

        if (ingredientsError) throw ingredientsError;

        // Fetch steps
        const { data: stepsData, error: stepsError } = await supabase
          .from("steps")
          .select("*")
          .eq("recipe_id", recipeId)
          .order("order_number", { ascending: true });

        if (stepsError) throw stepsError;

        // Transform ingredients data to match our expected format
        const ingredients: Ingredient[] = (ingredientsData || []).map(ing => {
          // Handle food and unit as objects with proper type checking
          const food = typeof ing.food === 'object' ? ing.food : null;
          const unit = typeof ing.unit === 'object' ? ing.unit : null;
          
          return {
            id: ing.id,
            food_id: food?.id || '',
            unit_id: unit?.id || '',
            amount: ing.amount,
            food: food || undefined,
            unit: unit || undefined
          };
        });

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
