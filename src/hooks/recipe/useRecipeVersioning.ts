
import { useState } from "react";
import { Recipe } from "@/types";
import { RecipeVersion } from "@/context/recipe/types";
import { useVersionFetching } from "./version/useVersionFetching";
import { useTemporaryVersions } from "./version/useTemporaryVersions";
import { useVersionManagement } from "./version/useVersionManagement";

export const useRecipeVersioning = (setRecipe: (recipe: Recipe) => void) => {
  const [recipeVersions, setRecipeVersions] = useState<RecipeVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>("");
  const [hasInitializedVersions, setHasInitializedVersions] = useState(false);

  // Use modular hooks for different versioning concerns
  const { isLoadingVersions, fetchVersionsFromDb } = useVersionFetching({
    setRecipeVersions,
    setActiveVersionId,
    setRecipe
  });

  const { addTemporaryVersion, persistVersion } = useTemporaryVersions({
    recipeVersions,
    setRecipeVersions,
    setActiveVersionId,
    setRecipe
  });

  const { 
    addRecipeVersion,
    setActiveVersion,
    renameRecipeVersion,
    deleteRecipeVersion 
  } = useVersionManagement({
    recipeVersions,
    setRecipeVersions,
    setActiveVersionId,
    activeVersionId,
    setRecipe
  });

  return {
    recipeVersions,
    activeVersionId,
    isLoadingVersions,
    fetchVersionsFromDb,
    addRecipeVersion,
    addTemporaryVersion,
    persistVersion,
    setActiveVersion,
    renameVersion: renameRecipeVersion,
    deleteVersion: deleteRecipeVersion,
    hasInitializedVersions,
    setHasInitializedVersions
  };
};
