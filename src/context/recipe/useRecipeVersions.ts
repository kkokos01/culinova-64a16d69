
import { useState } from "react";
import { Recipe } from "@/types";
import { RecipeVersion } from "./types";
import { fetchRecipeVersions, createRecipeVersion, setVersionActive, renameVersion, deleteVersion } from "@/api/recipeVersions";
import { v4 as uuidv4 } from "uuid";

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
        console.log("Setting active version from fetch:", activeVersion.id, activeVersion.name);
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

  // Add a temporary version (not persisted to DB)
  const addTemporaryVersion = (name: string, recipe: Recipe): RecipeVersion => {
    console.log("Creating new temporary recipe version:", name);
    // Generate a temporary ID with a prefix to distinguish from DB IDs
    const tempId = `temp-${uuidv4()}`;
    
    // Create the new temporary version object
    const newVersion: RecipeVersion = {
      id: tempId,
      name: name,
      recipe: recipe,
      isActive: true,
      isTemporary: true
    };
    
    // Update versions array - make all other versions inactive
    setRecipeVersions(prev => prev.map(v => ({
      ...v,
      isActive: false
    })).concat(newVersion));
    
    setActiveVersionId(newVersion.id);
    setRecipe(recipe);
    
    return newVersion;
  };

  // Persist a temporary version to the database
  const persistVersion = async (versionId: string): Promise<RecipeVersion> => {
    // Find the temporary version
    const tempVersion = recipeVersions.find(v => v.id === versionId);
    if (!tempVersion) {
      throw new Error("Version not found");
    }
    
    if (!tempVersion.isTemporary) {
      console.log("Version is already persisted");
      return tempVersion;
    }
    
    try {
      console.log("Persisting temporary version to database:", tempVersion.name);
      const userId = tempVersion.recipe.user_id;
      
      // Create a new version in the database
      const persistedVersion = await createRecipeVersion(tempVersion.name, tempVersion.recipe, userId);
      
      // Remove the temporary version from state
      setRecipeVersions(prev => 
        prev.filter(v => v.id !== versionId).concat(persistedVersion)
      );
      
      // Set this as the active version
      setActiveVersionId(persistedVersion.id);
      
      // Update active status in other versions
      setRecipeVersions(prev => 
        prev.map(v => ({
          ...v,
          isActive: v.id === persistedVersion.id
        }))
      );
      
      return persistedVersion;
    } catch (error) {
      console.error("Error persisting temporary version:", error);
      throw error;
    }
  };

  const addRecipeVersion = async (name: string, recipe: Recipe): Promise<RecipeVersion> => {
    try {
      console.log("Creating new recipe version:", name);
      const userId = recipe.user_id;
      const newVersion = await createRecipeVersion(name, recipe, userId);
      
      // Add the new version to our state and deactivate others
      setRecipeVersions(prev => prev.map(v => ({
        ...v,
        isActive: false
      })).concat(newVersion));
      
      // Set this as the active version
      setActiveVersionId(newVersion.id);
      setRecipe(newVersion.recipe);
      
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
      
      console.log("Setting active version:", version.id, version.name, "Recipe:", version.recipe.title);
      
      // IMPORTANT: We need to set the recipe data from the version BEFORE updating state
      // This ensures the UI is updated with the correct recipe content
      setRecipe(version.recipe);
      
      // If this is a temporary version, we just update the state
      if (version.isTemporary) {
        // Update local state
        setActiveVersionId(versionId);
        
        // Update active status in versions
        setRecipeVersions(prev => 
          prev.map(v => ({
            ...v,
            isActive: v.id === versionId
          }))
        );
      } else {
        // For persisted versions, update in database
        const recipeId = version.recipe.id;
        await setVersionActive(versionId, recipeId);
        
        // Update local state
        setActiveVersionId(versionId);
        
        // Update active status in versions
        setRecipeVersions(prev => 
          prev.map(v => ({
            ...v,
            isActive: v.id === versionId
          }))
        );
      }
    } catch (error) {
      console.error("Error setting active version:", error);
      throw error;
    }
  };

  const renameRecipeVersion = async (versionId: string, newName: string) => {
    try {
      const version = recipeVersions.find(v => v.id === versionId);
      if (!version) {
        throw new Error("Version not found");
      }
      
      // Handle temporary versions differently
      if (version.isTemporary) {
        // Just update local state for temporary versions
        setRecipeVersions(prev => 
          prev.map(v => v.id === versionId ? { ...v, name: newName } : v)
        );
      } else {
        // Update in database for persisted versions
        await renameVersion(versionId, newName);
        
        // Update local state
        setRecipeVersions(prev => 
          prev.map(v => v.id === versionId ? { ...v, name: newName } : v)
        );
      }
    } catch (error) {
      console.error("Error renaming version:", error);
      throw error;
    }
  };

  const deleteRecipeVersion = async (versionId: string) => {
    try {
      const version = recipeVersions.find(v => v.id === versionId);
      if (!version) {
        throw new Error("Version not found");
      }
      
      // Handle temporary versions differently
      if (version.isTemporary) {
        // Just remove from local state
        setRecipeVersions(prev => prev.filter(v => v.id !== versionId));
      } else {
        // Delete from database
        await deleteVersion(versionId);
        
        // Remove from local state
        setRecipeVersions(prev => prev.filter(v => v.id !== versionId));
      }
      
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
    addTemporaryVersion,
    persistVersion,
    setActiveVersion,
    renameVersion: renameRecipeVersion,
    deleteVersion: deleteRecipeVersion,
    hasInitializedVersions,
    setHasInitializedVersions
  };
}
