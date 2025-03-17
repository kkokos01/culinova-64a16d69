
import { useCallback } from "react";
import { Recipe, Ingredient } from "@/types";
import { useRecipeData } from "@/context/recipe/RecipeDataContext";
import { useModification } from "@/context/recipe/ModificationContext";
import { useVersioning } from "@/context/recipe/VersionContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Custom hook that centralizes the logic for the modification panel
 */
export const useModificationPanel = () => {
  // Access context data
  const { 
    recipe, 
    originalRecipe, 
    isModified, 
    setIsModified, 
    resetToOriginal 
  } = useRecipeData();
  
  const { 
    selectedIngredients, 
    removeIngredientSelection, 
    customInstructions, 
    setCustomInstructions,
    isAiModifying,
    handleStartModification
  } = useModification();
  
  const {
    recipeVersions,
    activeVersionId,
    persistVersion
  } = useVersioning();

  const { toast } = useToast();

  // Check if the current active version is temporary
  const isActiveVersionTemporary = useCallback(() => {
    const activeVersion = recipeVersions.find(v => v.id === activeVersionId);
    return Boolean(activeVersion?.isTemporary);
  }, [recipeVersions, activeVersionId]);

  // Handle saving changes
  const handleSaveChanges = useCallback(async () => {
    if (recipe) {
      try {
        // Find the active version
        const activeVersion = recipeVersions.find(v => v.id === activeVersionId);
        
        if (activeVersion?.isTemporary) {
          // Save the temporary version to the database
          await persistVersion(activeVersionId);
          
          toast({
            title: "Modifications Saved",
            description: "Recipe modifications have been saved to the database.",
          });
        }
        
        setIsModified(false);
      } catch (error) {
        console.error("Error saving modifications:", error);
        
        toast({
          title: "Error",
          description: "Failed to save modifications.",
          variant: "destructive"
        });
        
        throw error; // Re-throw to allow handling in UI
      }
    }
  }, [recipe, recipeVersions, activeVersionId, persistVersion, setIsModified, toast]);

  // Handle starting modification process
  const startModification = useCallback((modificationType: string) => {
    const hasSelectedIngredients = selectedIngredients.size > 0;
    const hasCustomInstructions = customInstructions.trim().length > 0;
    
    if (hasSelectedIngredients || hasCustomInstructions) {
      handleStartModification(modificationType);
    } else {
      // If no selections or instructions, start based just on the modification type
      handleStartModification(modificationType);
    }
  }, [selectedIngredients, customInstructions, handleStartModification]);

  return {
    recipe,
    isModified,
    resetToOriginal,
    selectedIngredients,
    removeIngredientSelection,
    customInstructions,
    setCustomInstructions,
    isAiModifying,
    startModification,
    handleSaveChanges,
    isActiveVersionTemporary: isActiveVersionTemporary()
  };
};
