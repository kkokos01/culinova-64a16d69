
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
      
      // DO NOT auto-activate versions from DB - let the calling code decide
      // This prevents auto-loading of modified versions on page refresh
      console.log("Versions fetched but NOT auto-activating (preventing modified version auto-load)");
      
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
