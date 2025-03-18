
import { useState } from "react";
import { Recipe } from "@/types";
import { RecipeVersion } from "@/context/recipe/types";
import { fetchRecipeVersions } from "@/api/recipeVersions";

interface VersionFetchingProps {
  setRecipeVersions: React.Dispatch<React.SetStateAction<RecipeVersion[]>>;
  setActiveVersionId: React.Dispatch<React.SetStateAction<string>>;
  setRecipe: (recipe: Recipe) => void;
}

export const useVersionFetching = ({
  setRecipeVersions,
  setActiveVersionId,
  setRecipe
}: VersionFetchingProps) => {
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  const fetchVersionsFromDb = async (recipeId: string): Promise<RecipeVersion[]> => {
    setIsLoadingVersions(true);
    try {
      console.log("Fetching versions from DB for recipe:", recipeId);
      const versions = await fetchRecipeVersions(recipeId);
      
      // Log the versions for debugging
      console.log(`Retrieved ${versions.length} versions from database:`, 
        versions.map(v => ({ id: v.id, name: v.name, isActive: v.isActive })));
      
      // Set the versions in state
      setRecipeVersions(versions);
      
      // Set the active version
      const activeVersion = versions.find(v => v.isActive);
      if (activeVersion) {
        console.log("Setting active version from fetch:", activeVersion.id, activeVersion.name);
        
        // Get the clean recipe title without any version prefixes
        const cleanTitle = getCleanTitle(activeVersion.recipe.title);
        
        // Prepare the recipe with the appropriate title based on version name
        const updatedRecipe = {
          ...activeVersion.recipe,
          title: activeVersion.name !== "Original" ? 
            `${activeVersion.name} ${cleanTitle}` : 
            cleanTitle
        };
        
        console.log("Setting recipe to:", updatedRecipe.title);
        setRecipe(updatedRecipe);
        setActiveVersionId(activeVersion.id);
      }
      
      setIsLoadingVersions(false);
      return versions;
    } catch (error) {
      console.error("Error fetching recipe versions:", error);
      setIsLoadingVersions(false);
      return [];
    }
  };

  // Helper to get clean title without version prefix
  const getCleanTitle = (title: string): string => {
    return title.replace(/^(Mild Version|Vegetarian Version|Spicy Coconut Chicken Tikka Masala)\s+/, '');
  };

  return {
    isLoadingVersions,
    fetchVersionsFromDb
  };
};
