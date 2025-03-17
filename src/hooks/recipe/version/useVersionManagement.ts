
import { Recipe } from "@/types";
import { RecipeVersion } from "@/context/recipe/types";
import { createRecipeVersion, setVersionActive, renameVersion, deleteVersion } from "@/api/recipeVersions";

interface VersionManagementProps {
  recipeVersions: RecipeVersion[];
  setRecipeVersions: React.Dispatch<React.SetStateAction<RecipeVersion[]>>;
  setActiveVersionId: React.Dispatch<React.SetStateAction<string>>;
  activeVersionId: string; // Add this parameter to access the current active version ID
  setRecipe: (recipe: Recipe) => void;
}

export const useVersionManagement = ({
  recipeVersions,
  setRecipeVersions,
  setActiveVersionId,
  activeVersionId, // Include in destructuring
  setRecipe
}: VersionManagementProps) => {
  const addRecipeVersion = async (name: string, recipe: Recipe): Promise<RecipeVersion> => {
    try {
      console.log("Creating new recipe version:", name);
      const userId = recipe.user_id;
      const newVersion = await createRecipeVersion(name, recipe, userId);
      
      // Set the recipe data first
      setRecipe(newVersion.recipe);
      
      // Add the new version to our state and deactivate others
      setRecipeVersions(prev => prev.map(v => ({
        ...v,
        isActive: false
      })).concat(newVersion));
      
      // Set this as the active version
      setActiveVersionId(newVersion.id);
      
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
      
      // CRITICAL: Set the recipe data FIRST before updating state
      // This ensures the UI is updated with the correct recipe content
      setRecipe(version.recipe);
      
      console.log("Recipe set to:", version.recipe.title);
      
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
      if (versionId === activeVersionId) {
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
    addRecipeVersion,
    setActiveVersion,
    renameRecipeVersion,
    deleteRecipeVersion
  };
};
