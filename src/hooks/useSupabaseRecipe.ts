
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
        
        if (!recipeId) {
          console.warn("No recipe ID provided to useSupabaseRecipe");
          setRecipe(null);
          setLoading(false);
          return;
        }
        
        // Fetch recipe data from Supabase
        console.log("Fetching recipe from Supabase:", recipeId);
        
        // Approach 1: Direct query with joins
        console.log("Using direct query approach with explicit joins");
          
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
          setRecipe(null);
          setLoading(false);
          return;
        }
        
        // Fetch ingredients with related data
        const { data: ingredients, error: ingredientsError } = await supabase
          .from('ingredients')
          .select(`
            *,
            food:food_id(*),
            unit:unit_id(*)
          `)
          .eq('recipe_id', recipeId);
          
        if (ingredientsError) {
          throw new Error(`Failed to fetch ingredients: ${ingredientsError.message}`);
        }
        
        // Log ingredient data for debugging
        console.log("Fetched ingredients data:", ingredients);
        
        // Fetch steps
        const { data: steps, error: stepsError } = await supabase
          .from('steps')
          .select('*')
          .eq('recipe_id', recipeId)
          .order('order_number');
          
        if (stepsError) {
          throw new Error(`Failed to fetch steps: ${stepsError.message}`);
        }
        
        // Combine into recipe object
        const completeRecipe: Recipe = {
          ...recipeData,
          ingredients: ingredients || [],
          steps: steps || []
        };
        
        console.log("Constructed recipe with data:", {
          id: completeRecipe.id,
          title: completeRecipe.title,
          ingredients: completeRecipe.ingredients?.map(i => ({
            id: i.id,
            food_name: i.food?.name,
            amount: i.amount,
            unit: i.unit?.abbreviation
          }))
        });
        
        setRecipe(completeRecipe);
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
