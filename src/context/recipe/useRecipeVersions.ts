
import { useState } from "react";
import { Recipe } from "@/types";
import { RecipeVersion } from "./types";
import { useToast } from "@/hooks/use-toast";
import * as recipeVersionsApi from "@/api/recipeVersions";

export function useRecipeVersions(setRecipe: (recipe: Recipe) => void) {
  const [recipeVersions, setRecipeVersions] = useState<RecipeVersion[]>([]);
  const [hasInitializedVersions, setHasInitializedVersions] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const { toast } = useToast();

  // Calculate active version ID from the versions array
  const activeVersionId = recipeVersions.find(v => v.isActive)?.id || "";

  // Fetch versions from the database for a specific recipe
  const fetchVersionsFromDb = async (recipeId: string) => {
    if (!recipeId) return;
    
    setIsLoadingVersions(true);
    
    try {
      const versions = await recipeVersionsApi.fetchRecipeVersions(recipeId);
      setRecipeVersions(versions);
      
      // Set active recipe if there's an active version
      const activeVersion = versions.find(v => v.isActive);
      if (activeVersion) {
        setRecipe(activeVersion.recipe);
      }
    } catch (error: any) {
      console.error('Error fetching recipe versions:', error.message);
      toast({
        title: "Error loading recipe versions",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingVersions(false);
    }
  };

  // Add a new recipe version to the database
  const addRecipeVersion = async (name: string, recipe: Recipe) => {
    if (!recipe || !recipe.id) {
      console.error("Cannot create version: Recipe is undefined or missing ID");
      return;
    }
    
    try {
      // Check if version with this name already exists
      const versionExists = recipeVersions.some(v => v.name === name);
      
      // If it's the "Original" version and we already have it, don't create another one
      if (name === "Original" && versionExists) {
        // Just make sure Original is active if that's what we want
        setActiveVersion(recipeVersions.find(v => v.name === "Original")?.id || "");
        return;
      }
      
      // Calculate next version number
      const nextVersionNumber = recipeVersions.length > 0 
        ? Math.max(...recipeVersions.map(v => parseInt(v.id.split('-')[0]) || 0)) + 1 
        : 1;
      
      // For non-Original versions or if Original doesn't exist yet
      // Create a display name that ensures uniqueness
      const displayName = versionExists ? `${name} (${new Date().toLocaleTimeString()})` : name;
      
      // Create the new version
      const newVersion = await recipeVersionsApi.createRecipeVersion(
        displayName, 
        recipe, 
        recipe.user_id || ''
      );
      
      // Update local state
      setRecipeVersions(prev => {
        // Deactivate all existing versions
        const updatedVersions = prev.map(version => ({
          ...version,
          isActive: false
        }));
        
        return [...updatedVersions, newVersion];
      });
      
      // Set the newly created version as the active recipe
      setRecipe(newVersion.recipe);
      
    } catch (error: any) {
      console.error('Error creating recipe version:', error.message);
      toast({
        title: "Error creating version",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Set active version
  const setActiveVersion = async (versionId: string) => {
    try {
      // Get the recipe for this version ID
      const versionToActivate = recipeVersions.find(v => v.id === versionId);
      
      if (!versionToActivate) {
        throw new Error("Version not found");
      }
      
      // Update database
      await recipeVersionsApi.setVersionActive(versionId, versionToActivate.recipe.id);
      
      // Update recipe in the parent component
      setRecipe(versionToActivate.recipe);
      
      // Update local state
      setRecipeVersions(prev => 
        prev.map(version => ({
          ...version,
          isActive: version.id === versionId
        }))
      );
    } catch (error: any) {
      console.error('Error setting active version:', error.message);
      toast({
        title: "Error activating version",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Rename version
  const renameVersion = async (versionId: string, newName: string) => {
    try {
      // Don't allow renaming Original
      const originalVersion = recipeVersions.find(v => v.name === "Original");
      if (originalVersion && originalVersion.id === versionId && newName !== "Original") {
        return;
      }
      
      // Update in database
      await recipeVersionsApi.renameVersion(versionId, newName);
      
      // Update local state
      setRecipeVersions(prev => 
        prev.map(version => 
          version.id === versionId 
            ? { ...version, name: newName } 
            : version
        )
      );
    } catch (error: any) {
      console.error('Error renaming version:', error.message);
      toast({
        title: "Error renaming version",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Delete version
  const deleteVersion = async (versionId: string) => {
    try {
      // Don't allow deleting Original
      const originalVersion = recipeVersions.find(v => v.name === "Original");
      if (originalVersion && originalVersion.id === versionId) {
        toast({
          title: "Cannot delete Original version",
          description: "The Original version cannot be deleted.",
          variant: "destructive"
        });
        return;
      }
      
      // Find if the version being deleted is active
      const isActiveVersion = recipeVersions.find(v => v.id === versionId)?.isActive || false;
      
      // Delete from database
      await recipeVersionsApi.deleteVersion(versionId);
      
      // Filter out the version to delete
      const remainingVersions = recipeVersions.filter(version => version.id !== versionId);
      
      // If we deleted the active version, make the first remaining version active
      if (isActiveVersion && remainingVersions.length > 0) {
        await setActiveVersion(remainingVersions[0].id);
      }
      
      // Update local state
      setRecipeVersions(remainingVersions);
    } catch (error: any) {
      console.error('Error deleting version:', error.message);
      toast({
        title: "Error deleting version",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return {
    recipeVersions,
    activeVersionId,
    hasInitializedVersions,
    setHasInitializedVersions,
    isLoadingVersions,
    fetchVersionsFromDb,
    addRecipeVersion,
    setActiveVersion,
    renameVersion,
    deleteVersion
  };
}
