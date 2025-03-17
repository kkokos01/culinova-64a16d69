
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { recipeService } from "@/services/supabase/recipeService";

interface RecipeFinderProps {
  currentRecipeId: string | undefined;
}

const RecipeFinder: React.FC<RecipeFinderProps> = ({ currentRecipeId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  // Check for the 'findRecipe' query parameter on component mount
  React.useEffect(() => {
    const recipeName = searchParams.get('findRecipe');
    if (recipeName) {
      findRecipeByName(recipeName);
    }
  }, [searchParams]);

  const findRecipeByName = async (recipeName: string) => {
    setLoading(true);
    try {
      // Use our service to find the recipe
      const recipe = await recipeService.findRecipeByName(recipeName);
      
      if (recipe) {
        // Remove the query param
        searchParams.delete('findRecipe');
        setSearchParams(searchParams);
        
        // Navigate to the specific recipe
        if (currentRecipeId !== recipe.id) {
          toast({
            title: `${recipe.title} Recipe Found`,
            description: "Navigating to the recipe"
          });
          navigate(`/recipes/${recipe.id}`);
        }
      } else {
        toast({
          title: "Recipe Not Found",
          description: `Could not locate a recipe matching "${recipeName}"`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Error finding recipe "${recipeName}":`, error);
      toast({
        title: "Error",
        description: `Failed to search for "${recipeName}" recipe`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default RecipeFinder;
