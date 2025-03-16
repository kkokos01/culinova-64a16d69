
import { useState } from "react";
import { Recipe } from "@/types";
import { RecipeVersion } from "./types";
import { v4 as uuidv4 } from 'uuid';

export function useRecipeVersions(setRecipe: (recipe: Recipe) => void) {
  const [recipeVersions, setRecipeVersions] = useState<RecipeVersion[]>([]);
  const [hasInitializedVersions, setHasInitializedVersions] = useState(false);

  // Calculate active version ID from the versions array
  const activeVersionId = recipeVersions.find(v => v.isActive)?.id || "";

  // Add a new recipe version - with safeguards
  const addRecipeVersion = (name: string, recipe: Recipe) => {
    // Check if version with this name already exists
    const versionExists = recipeVersions.some(v => v.name === name);
    
    // If it's the "Original" version and we already have it, don't create another one
    if (name === "Original" && versionExists) {
      // Just make sure Original is active if that's what we want
      setActiveVersion(recipeVersions.find(v => v.name === "Original")?.id || "");
      return;
    }
    
    // For non-Original versions or if Original doesn't exist yet:
    // Deactivate all existing versions
    const updatedVersions = recipeVersions.map(version => ({
      ...version,
      isActive: false
    }));
    
    // Create a new version with unique ID and set it as active
    const newVersion: RecipeVersion = {
      id: uuidv4(),
      name: versionExists ? `${name} (${new Date().toLocaleTimeString()})` : name,
      recipe: { ...recipe },
      isActive: true
    };
    
    setRecipeVersions([...updatedVersions, newVersion]);
  };

  // Set active version
  const setActiveVersion = (versionId: string) => {
    const updatedVersions = recipeVersions.map(version => {
      const isActive = version.id === versionId;
      // If this version is being activated, also update the current recipe
      if (isActive) {
        setRecipe(version.recipe);
      }
      return {
        ...version,
        isActive
      };
    });
    
    setRecipeVersions(updatedVersions);
  };

  // Rename version
  const renameVersion = (versionId: string, newName: string) => {
    // Don't allow renaming Original
    const originalVersion = recipeVersions.find(v => v.name === "Original");
    if (originalVersion && originalVersion.id === versionId && newName !== "Original") {
      return;
    }
    
    const updatedVersions = recipeVersions.map(version => 
      version.id === versionId 
        ? { ...version, name: newName } 
        : version
    );
    
    setRecipeVersions(updatedVersions);
  };

  // Delete version
  const deleteVersion = (versionId: string) => {
    // Don't allow deleting Original
    const originalVersion = recipeVersions.find(v => v.name === "Original");
    if (originalVersion && originalVersion.id === versionId) {
      return;
    }
    
    // Find if the version being deleted is active
    const isActiveVersion = recipeVersions.find(v => v.id === versionId)?.isActive || false;
    
    // Filter out the version to delete
    const remainingVersions = recipeVersions.filter(version => version.id !== versionId);
    
    // If we deleted the active version, make the first remaining version active
    if (isActiveVersion && remainingVersions.length > 0) {
      remainingVersions[0].isActive = true;
      setRecipe(remainingVersions[0].recipe);
    }
    
    setRecipeVersions(remainingVersions);
  };

  return {
    recipeVersions,
    activeVersionId,
    hasInitializedVersions,
    setHasInitializedVersions,
    addRecipeVersion,
    setActiveVersion,
    renameVersion,
    deleteVersion
  };
}
