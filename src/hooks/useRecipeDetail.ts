
import { useEffect } from "react";
import { useRecipe } from "@/context/recipe";
import { useRecipeData } from "@/hooks/recipe/useRecipeData";
import { useRecipeModification } from "@/hooks/recipe/useRecipeModification";
import { Ingredient } from "@/types";

export const useRecipeDetail = () => {
  // Use our specialized hooks
  const { 
    recipe, 
    loading, 
    error, 
    setRecipe, 
    originalRecipe, 
    setOriginalRecipe 
  } = useRecipeData();
  
  // Get the context for version management
  const { 
    fetchVersionsFromDb,
    addRecipeVersion,
    addTemporaryVersion,
    persistVersion,
    recipeVersions,
    hasInitializedVersions,
    setHasInitializedVersions,
  } = useRecipe();
  
  // Use the modification hook
  const {
    selectedIngredient,
    setSelectedIngredient,
    selectedIngredients,
    selectIngredientForModification,
    removeIngredientSelection,
    customInstructions,
    setCustomInstructions,
    isModified,
    setIsModified,
    isAiModifying,
    setIsAiModifying,
    handleStartModification: startModification
  } = useRecipeModification(recipe, addTemporaryVersion);
  
  // Set recipe in context when data is loaded
  useEffect(() => {
    if (recipe) {
      console.log("Setting recipe in context:", recipe);
      setRecipe(recipe);
      setOriginalRecipe(recipe);
    }
  }, [recipe, setRecipe, setOriginalRecipe]);
  
  // Fetch versions from the database when recipe data is loaded
  useEffect(() => {
    const initializeVersions = async () => {
      if (recipe && !hasInitializedVersions) {
        console.log("Initializing versions for recipe", recipe.id);
        
        try {
          // Fetch versions from the database
          const versions = await fetchVersionsFromDb(recipe.id);
          
          // If no versions exist yet, create the Original version
          if (versions.length === 0) {
            console.log("No versions found, creating Original version for recipe", recipe.id);
            await addRecipeVersion("Original", recipe);
          } else {
            console.log("Found existing versions:", versions.length);
          }
        } catch (error) {
          console.error("Error initializing versions:", error);
        } finally {
          // Mark that we've initialized versions to prevent re-initialization
          setHasInitializedVersions(true);
        }
      }
    };
    
    initializeVersions();
  }, [recipe, hasInitializedVersions, addRecipeVersion, setHasInitializedVersions, fetchVersionsFromDb]);

  // Function to handle ingredient selection
  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    // Using the context function to update selected ingredients
    selectIngredientForModification(ingredient, action);
  };

  const handleModifyWithAI = () => {
    // Open the AI modification panel
    // For desktop, the panel is already visible in the left panel
  };
  
  // Pass the actual handler to the modification hook
  const handleStartModification = (modificationType: string) => {
    startModification(modificationType);
  };
  
  const resetToOriginal = () => {
    if (originalRecipe) {
      setRecipe(originalRecipe);
      setIsModified(false);
    }
  };
  
  const handleAcceptChanges = async () => {
    if (recipe) {
      try {
        // Find the active version (which should be temporary)
        const activeVersion = recipeVersions.find(v => v.id === recipe.id);
        
        if (activeVersion?.isTemporary) {
          // Save the temporary version to the database
          await persistVersion(activeVersion.id);
        } else {
          // Fall back to creating a new persisted version if needed
          await addRecipeVersion("Modified", recipe);
        }
        
        setIsModified(false);
      } catch (error) {
        console.error("Error saving modifications:", error);
      }
    }
  };

  return {
    recipeData: recipe,
    isLoading: loading,
    error,
    selectedIngredient,
    isModified,
    resetToOriginal,
    handleModifyWithAI,
    handleStartModification,
    handleAcceptChanges,
    setSelectedIngredient,
    handleSelectIngredient,
    isAiModifying
  };
};
