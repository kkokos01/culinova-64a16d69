
import { useState, useEffect } from "react";
import { Recipe } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useSupabaseRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        
        // Fetch recipe data from Supabase
        console.log("Fetching recipes from Supabase");
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw new Error(`Failed to fetch recipes: ${error.message}`);
        }

        console.log("Fetched recipes:", data);
        setRecipes(data as Recipe[]);
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
    };

    fetchRecipes();
  }, [toast]);

  return { recipes, loading, error };
};
