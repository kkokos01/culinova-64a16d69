import { v4 as uuidv4 } from "uuid";
import { Recipe } from "@/types";
import { RecipeVersion } from "@/context/recipe/types";
import { createRecipeVersion } from "@/api/versions/createVersion";
import { createStandaloneRecipeFromVersion } from "@/api/versions/createStandaloneRecipe";

interface TemporaryVersionsProps {
  recipeVersions: RecipeVersion[];
  setRecipeVersions: React.Dispatch<React.SetStateAction<RecipeVersion[]>>;
  setActiveVersionId: React.Dispatch<React.SetStateAction<string>>;
  setRecipe: (recipe: Recipe) => void;
}

export const useTemporaryVersions = ({
  recipeVersions,
  setRecipeVersions,
  setActiveVersionId,
  setRecipe
}: TemporaryVersionsProps) => {
  // Add a temporary version (not persisted to DB)
  const addTemporaryVersion = (name: string, recipe: Recipe): RecipeVersion => {
    console.log("Creating new temporary recipe version:", name);
    // Generate a temporary ID with a prefix to distinguish from DB IDs
    const tempId = `temp-${uuidv4()}`;
    
    // Create the new temporary version object
    // Note: recipe.title already contains the complete title from AI response
    const newVersion: RecipeVersion = {
      id: tempId,
      name: name,
      recipe: recipe, // Use recipe as-is without title manipulation
      isActive: true,
      isTemporary: true
    };
    
    // Set recipe data first
    setRecipe(recipe);
    
    // Update versions array - make all other versions inactive
    setRecipeVersions(prev => prev.map(v => ({
      ...v,
      isActive: false
    })).concat(newVersion));
    
    setActiveVersionId(newVersion.id);
    
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
      
      // Create standalone recipe for user's collection
      console.log("Creating standalone recipe from modification:", tempVersion.recipe.title);
      const standaloneRecipe = await createStandaloneRecipeFromVersion(
        tempVersion.recipe, 
        userId, 
        tempVersion.recipe.id // parent recipe ID
      );
      console.log("Standalone recipe created successfully:", standaloneRecipe.id);
      
      // Set recipe data first - use the recipe title as-is since it already includes the version name
      const updatedRecipe = {
        ...persistedVersion.recipe,
        title: tempVersion.recipe.title // Use the temporary version's recipe title directly
      };
      
      setRecipe(updatedRecipe);
      
      // Remove the temporary version from state and add the persisted one
      setRecipeVersions(prev => 
        prev.filter(v => v.id !== versionId).concat({
          ...persistedVersion,
          recipe: updatedRecipe
        })
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

  return {
    addTemporaryVersion,
    persistVersion
  };
};
