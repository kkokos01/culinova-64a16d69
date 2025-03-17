
import { useState, useEffect } from "react";
import { Recipe } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { recipeService } from "@/services/supabase/recipeService";

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
        
        // Debug log for recipe ingredients
        if (recipeData?.ingredients) {
          console.log("Received ingredients from service:", recipeData.ingredients.map(ing => ({
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
