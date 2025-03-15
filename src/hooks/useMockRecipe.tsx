
import { useEffect, useState } from "react";
import { Recipe } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { mockRecipe } from "@/data/mockData";

export const useMockRecipe = (recipeId: string) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // For now, always return our mock recipe regardless of ID
        setRecipe(mockRecipe);
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

    fetchRecipe();
  }, [recipeId, toast]);

  return { recipe, loading, error };
};
