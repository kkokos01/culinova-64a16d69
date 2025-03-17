
import { useState, useEffect } from "react";
import { Recipe } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { recipeService } from "@/services/supabase/recipeService";
import { normalizeFood, normalizeUnit } from "@/api/types/supabaseTypes";

export const useSupabaseRecipe = (recipeId: string) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        
        if (!recipeId) {
          console.warn("No recipe ID provided to useSupabaseRecipe");
          setRecipe(null);
          setLoading(false);
          return;
        }
        
        // Use our service to fetch the recipe with proper singular naming
        console.log("Fetching recipe from hook:", recipeId);
        const recipeData = await recipeService.getRecipe(recipeId);
        
        // Normalize ingredients using our helper functions
        if (recipeData?.ingredients) {
          // Create a new array with properly typed ingredients
          // Use type assertion (as Ingredient) to tell TypeScript that 
          // we're ensuring the result will conform to the Ingredient type
          recipeData.ingredients = recipeData.ingredients.map(ing => ({
            ...ing,
            food: normalizeFood(ing.food),
            unit: normalizeUnit(ing.unit)
          // Type assertion to tell TypeScript we've validated this structure
          })) as Recipe['ingredients'];
          
          console.log("Normalized ingredients:", recipeData.ingredients.map(ing => ({
            id: ing.id,
            foodId: ing.food_id,
            food: ing.food ? ing.food.name : 'missing food',
            unitId: ing.unit_id,
            unit: ing.unit ? ing.unit.abbreviation : 'missing unit'
          })));
        }
        
        setRecipe(recipeData);
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

  return { recipe, loading, error };
};
