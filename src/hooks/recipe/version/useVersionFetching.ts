
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
      
      setRecipeVersions(versions);
      
      // Set the active version
      const activeVersion = versions.find(v => v.isActive);
      if (activeVersion) {
        console.log("Setting active version from fetch:", activeVersion.id, activeVersion.name);
        
        // IMPORTANT: Set recipe data first before updating UI state
        setRecipe(activeVersion.recipe);
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

  return {
    isLoadingVersions,
    fetchVersionsFromDb
  };
};
