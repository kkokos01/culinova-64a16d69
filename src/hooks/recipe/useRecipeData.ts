
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Recipe } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { recipeService } from "@/services/supabase/recipeService";
import { normalizeFood, normalizeUnit } from "@/api/types/supabaseTypes";

export const useRecipeData = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [originalRecipe, setOriginalRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch recipe data from Supabase
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          console.warn("No recipe ID provided to useRecipeData");
          setRecipe(null);
          setLoading(false);
          return;
        }
        
        console.log("Fetching recipe from useRecipeData:", id);
        const recipeData = await recipeService.getRecipe(id);
        
        // Normalize ingredients using our helper functions
        if (recipeData?.ingredients) {
          recipeData.ingredients = recipeData.ingredients.map(ing => ({
            ...ing,
            food: normalizeFood(ing.food),
            unit: normalizeUnit(ing.unit)
          })) as Recipe['ingredients'];
        }
        
        setRecipe(recipeData);
        setOriginalRecipe(recipeData);
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

    if (id) {
      fetchRecipe();
    } else {
      setLoading(false);
    }
  }, [id, toast]);

  // Handle recipe not found scenario
  useEffect(() => {
    if (!loading && !recipe && !error) {
      toast({
        title: "Recipe not found",
        description: "The recipe you're looking for couldn't be found. Redirecting to recipes page.",
        variant: "destructive"
      });
      
      // Redirect to recipes page after a short delay
      const timeout = setTimeout(() => {
        navigate('/recipes');
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [recipe, loading, navigate, toast, error]);

  return {
    recipe,
    loading,
    error,
    setRecipe,
    originalRecipe,
    setOriginalRecipe
  };
};
