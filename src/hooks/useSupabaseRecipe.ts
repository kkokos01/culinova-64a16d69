
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
        
        // Fetch ingredients with related data, ensuring we get food details
        const { data: ingredientsWithFood, error: ingredientsError } = await supabase
          .from('ingredients')
          .select(`
            id, 
            recipe_id,
            food_id,
            unit_id,
            amount,
            order_index,
            foods:food_id(id, name, description, is_validated, confidence_score, source),
            units:unit_id(id, name, abbreviation)
          `)
          .eq('recipe_id', recipeId);
          
        if (ingredientsError) {
          throw new Error(`Failed to fetch ingredients: ${ingredientsError.message}`);
        }
        
        // Transform ingredients to ensure proper structure for our Recipe type
        const ingredients = ingredientsWithFood?.map(ingredient => {
          // Transform the joined foods data to be in the expected "food" property
          // Important: foods and units from the join are objects, not arrays
          return {
            id: ingredient.id,
            recipe_id: ingredient.recipe_id,
            food_id: ingredient.food_id,
            unit_id: ingredient.unit_id,
            amount: ingredient.amount,
            order_index: ingredient.order_index,
            food: ingredient.foods || null, // Ensure this is an object, not an array
            unit: ingredient.units || null  // Ensure this is an object, not an array
          };
        }) || [];
        
        // Log processed ingredients for debugging
        console.log("Processed ingredients:", ingredients.map(i => ({
          id: i.id,
          food: i.food,
          food_name: i.food?.name || 'Unknown food',
          unit: i.unit,
          unit_abbr: i.unit?.abbreviation || '',
          amount: i.amount
        })));
        
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
            food_name: i.food?.name || 'Unknown',
            amount: i.amount,
            unit: i.unit?.abbreviation || ''
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
