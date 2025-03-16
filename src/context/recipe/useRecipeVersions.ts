
import { useState } from "react";
import { Recipe } from "@/types";
import { RecipeVersion } from "./types";
import { fetchRecipeVersions, createRecipeVersion, setVersionActive, renameVersion, deleteVersion } from "@/api/recipeVersions";

export function useRecipeVersions(setRecipe: (recipe: Recipe) => void) {
  const [recipeVersions, setRecipeVersions] = useState<RecipeVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>("");
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [hasInitializedVersions, setHasInitializedVersions] = useState(false);

  const fetchVersionsFromDb = async (recipeId: string): Promise<RecipeVersion[]> => {
    setIsLoadingVersions(true);
    try {
      console.log("Fetching versions from DB for recipe:", recipeId);
      const versions = await fetchRecipeVersions(recipeId);
      
      setRecipeVersions(versions);
      
      // Set the active version
      const activeVersion = versions.find(v => v.isActive);
      if (activeVersion) {
        setActiveVersionId(activeVersion.id);
        setRecipe(activeVersion.recipe);
      }
      
      setIsLoadingVersions(false);
      return versions;
    } catch (error) {
      console.error("Error fetching recipe versions:", error);
      setIsLoadingVersions(false);
      return [];
    }
  };

  const addRecipeVersion = async (name: string, recipe: Recipe): Promise<RecipeVersion> => {
    try {
      console.log("Creating new recipe version:", name);
      const userId = recipe.user_id;
      const newVersion = await createRecipeVersion(name, recipe, userId);
      
      // Add the new version to our state
      setRecipeVersions(prev => [...prev, newVersion]);
      
      // Set this as the active version
      setActiveVersionId(newVersion.id);
      
      // Update active status in other versions
      setRecipeVersions(prev => 
        prev.map(v => ({
          ...v,
          isActive: v.id === newVersion.id
        }))
      );
      
      return newVersion;
    } catch (error) {
      console.error("Error adding recipe version:", error);
      throw error;
    }
  };

  const setActiveVersion = async (versionId: string) => {
    try {
      if (!recipeVersions.length) return;
      
      const version = recipeVersions.find(v => v.id === versionId);
      if (!version) {
        throw new Error("Version not found");
      }
      
      // Update in database
      const recipeId = version.recipe.id;
      await setVersionActive(versionId, recipeId);
      
      // Update local state
      setActiveVersionId(versionId);
      setRecipe(version.recipe);
      
      // Update active status in versions
      setRecipeVersions(prev => 
        prev.map(v => ({
          ...v,
          isActive: v.id === versionId
        }))
      );
    } catch (error) {
      console.error("Error setting active version:", error);
      throw error;
    }
  };

  const renameRecipeVersion = async (versionId: string, newName: string) => {
    try {
      await renameVersion(versionId, newName);
      
      // Update local state
      setRecipeVersions(prev => 
        prev.map(v => v.id === versionId ? { ...v, name: newName } : v)
      );
    } catch (error) {
      console.error("Error renaming version:", error);
      throw error;
    }
  };

  const deleteRecipeVersion = async (versionId: string) => {
    try {
      await deleteVersion(versionId);
      
      // Remove from local state
      setRecipeVersions(prev => prev.filter(v => v.id !== versionId));
      
      // If we deleted the active version, set another one as active
      if (activeVersionId === versionId && recipeVersions.length > 1) {
        const newActiveVersion = recipeVersions.find(v => v.id !== versionId);
        if (newActiveVersion) {
          setActiveVersion(newActiveVersion.id);
        }
      }
    } catch (error) {
      console.error("Error deleting version:", error);
      throw error;
    }
  };

  return {
    recipeVersions,
    activeVersionId,
    isLoadingVersions,
    fetchVersionsFromDb,
    addRecipeVersion,
    setActiveVersion,
    renameVersion: renameRecipeVersion,
    deleteVersion: deleteRecipeVersion,
    hasInitializedVersions,
    setHasInitializedVersions
  };
}
