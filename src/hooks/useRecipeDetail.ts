
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
    selectedIngredients: contextSelectedIngredients, 
    selectIngredientForModification: contextSelectIngredientForModification,
    removeIngredientSelection: contextRemoveIngredientSelection
  } = useRecipe();
  
  // Use the modification hook
  const {
    selectedIngredient,
    setSelectedIngredient,
    selectedIngredients: hookSelectedIngredients,
    selectIngredientForModification: hookSelectIngredientForModification,
    removeIngredientSelection: hookRemoveIngredientSelection,
    customInstructions,
    setCustomInstructions,
    isModified,
    setIsModified,
    isAiModifying,
    setIsAiModifying,
    handleStartModification: startModification
  } = useRecipeModification(recipe, addTemporaryVersion);
  
  // Use either context or hook implementation based on what's available
  const selectedIngredients = contextSelectedIngredients || hookSelectedIngredients;
  const selectIngredientForModificationImpl = contextSelectIngredientForModification || hookSelectIngredientForModification;
  const removeIngredientSelectionImpl = contextRemoveIngredientSelection || hookRemoveIngredientSelection;
  
  // Set recipe in context when data is loaded
  useEffect(() => {
    if (recipe) {
      console.log("Setting recipe in context:", recipe);
      setRecipe(recipe);
      setOriginalRecipe(recipe);
    }
  }, [recipe, setRecipe, setOriginalRecipe]);
  
  // Temporarily disabled auto-versioning to fix recipe creation
  // TODO: Re-enable after fixing versioning system to handle text-based ingredients
  useEffect(() => {
    const initializeVersions = async () => {
      if (recipe && !hasInitializedVersions) {
        console.log("Versioning temporarily disabled for recipe", recipe.id);
        
        // Mark that we've initialized versions to prevent re-initialization
        setHasInitializedVersions(true);
        return;
        
        // Original versioning code (commented out)
        /*
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
        */
      }
    };
    
    initializeVersions();
  }, [recipe, hasInitializedVersions, addRecipeVersion, setHasInitializedVersions, fetchVersionsFromDb]);

  // Function to handle ingredient selection
  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    console.log("handleSelectIngredient called with:", ingredient.id, action);
    // Using the implementation function to update selected ingredients
    selectIngredientForModificationImpl(ingredient, action);
  };

  const handleModifyWithAI = () => {
    // Open the AI modification panel
    // For desktop, the panel is already visible in the left panel
  };
  
  // Handle starting modification with instructions
  const handleStartModification = (modificationType: string) => {
    console.log("Starting modification with type:", modificationType);
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
    selectedIngredients,
    isModified,
    resetToOriginal,
    handleModifyWithAI,
    handleStartModification,
    handleAcceptChanges,
    setSelectedIngredient,
    handleSelectIngredient,
    isAiModifying,
    removeIngredientSelection: removeIngredientSelectionImpl
  };
};
