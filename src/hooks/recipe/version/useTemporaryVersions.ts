
import { v4 as uuidv4 } from "uuid";
import { Recipe } from "@/types";
import { RecipeVersion } from "@/context/recipe/types";
import { createRecipeVersion } from "@/api/recipeVersions";

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
    
    // Update recipe title to include version name if not "Original"
    const updatedRecipe = {
      ...recipe,
      title: name !== "Original" ? 
        `${name} ${recipe.title.replace(/^(Mild Version|Vegetarian Version|Spicy Coconut Chicken Tikka Masala)\s+/, '')}` : 
        recipe.title.replace(/^(Mild Version|Vegetarian Version|Spicy Coconut Chicken Tikka Masala)\s+/, '')
    };
    
    // Create the new temporary version object
    const newVersion: RecipeVersion = {
      id: tempId,
      name: name,
      recipe: updatedRecipe,
      isActive: true,
      isTemporary: true
    };
    
    // Set recipe data first
    setRecipe(updatedRecipe);
    
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
      
      // Set recipe data first - ensure title includes version name
      const updatedRecipe = {
        ...persistedVersion.recipe,
        title: persistedVersion.name !== "Original" ? 
          `${persistedVersion.name} ${persistedVersion.recipe.title.replace(/^(Mild Version|Vegetarian Version|Spicy Coconut Chicken Tikka Masala)\s+/, '')}` : 
          persistedVersion.recipe.title.replace(/^(Mild Version|Vegetarian Version|Spicy Coconut Chicken Tikka Masala)\s+/, '')
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
