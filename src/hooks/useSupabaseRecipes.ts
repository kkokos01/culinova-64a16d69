
import { useState, useEffect, useCallback } from "react";
import { Recipe } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";

export const useSupabaseRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentSpace } = useSpace();

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch recipe data from Supabase
      console.log("Fetching recipes from Supabase");
      console.log("Current user:", user?.id);
      console.log("Current space:", currentSpace?.id);
      
      // Optimized query with all existing database fields
      let query = supabase
        .from('recipes')
        .select('id, title, description, image_url, prep_time_minutes, cook_time_minutes, servings, difficulty, is_public, privacy_level, created_at, updated_at, user_id, space_id, calories_per_serving');
      
      // Apply filtering based on space or user
      if (currentSpace?.id) {
        console.log(`Filtering by space_id: ${currentSpace.id}`);
        query = query.eq('space_id', currentSpace.id);
      } else if (user?.id) {
        // If no space but we have a user, filter by user_id
        console.log(`Filtering by user_id: ${user.id}`);
        query = query.eq('user_id', user.id);
      } else {
        // If no space and no user, get public recipes or use specific ids for testing
        console.log("No space or user, fetching public recipes");
        query = query.eq('is_public', true);
      }
      
      // Order by creation date
      query = query.order('created_at', { ascending: false });
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch recipes: ${error.message}`);
      }

      // Log the raw data for debugging
      console.log("Raw recipe data:", data);
      
      // Filter out recipes that don't have the necessary details
      const validRecipes = data ? data.filter(recipe => 
        recipe && recipe.id && recipe.title
      ) : [];

      console.log("Filtered valid recipes:", validRecipes.length);
      
      // Set recipes directly - ingredients and steps are stored in separate tables
      setRecipes(validRecipes as Recipe[]);
      
      if (validRecipes.length === 0) {
        console.log("No recipes found. Consider adding some test recipes to the database.");
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch recipes"));
      setLoading(false);
      
      toast({
        title: "Error loading recipes",
        description: err instanceof Error ? err.message : "Failed to fetch recipes",
        variant: "destructive"
      });
    }
  }, [toast, user, currentSpace]);

  // Call fetchRecipes when dependencies change
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return { recipes, loading, error, refreshRecipes: fetchRecipes };
};
