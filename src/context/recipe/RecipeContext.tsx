
import React, { useContext } from "react";
import { Recipe, Ingredient } from "@/types";
import { useRecipeState } from "./useRecipeState";
import { useIngredientSelection } from "./useIngredientSelection";
import { useRecipeVersioning } from "@/hooks/recipe/useRecipeVersioning";
import { RecipeContextType } from "./types";
import { RecipeDataProvider } from "./RecipeDataContext";
import { ModificationProvider } from "./ModificationContext";
import { VersionProvider } from "./VersionContext";

// Create the context with default values
const RecipeContext = React.createContext<RecipeContextType | undefined>(undefined);

// Provider component that wraps the children
export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log("RecipeProvider initializing");
  
  // Use our custom hooks to manage different aspects of recipe state
  const recipeState = useRecipeState();
  
  const ingredientSelection = useIngredientSelection();
  
  const versionState = useRecipeVersioning(recipeState.setRecipe);

  // Combine all the state and functions into a single context value
  const value: RecipeContextType = {
    ...recipeState,
    ...ingredientSelection,
    ...versionState,
  };

  // Reset to original recipe function
  const resetToOriginal = () => {
    if (recipeState.originalRecipe) {
      recipeState.setRecipe(recipeState.originalRecipe);
      recipeState.setIsModified(false);
    }
  };

  // Create context values for each provider
  const recipeDataValue = {
    recipe: recipeState.recipe,
    setRecipe: recipeState.setRecipe,
    originalRecipe: recipeState.originalRecipe,
    setOriginalRecipe: recipeState.setOriginalRecipe,
    isModified: recipeState.isModified,
    setIsModified: recipeState.setIsModified,
    resetToOriginal
  };

  const modificationValue = {
    selectedIngredient: ingredientSelection.selectedIngredient,
    setSelectedIngredient: ingredientSelection.setSelectedIngredient,
    selectedIngredients: ingredientSelection.selectedIngredients,
    selectIngredientForModification: ingredientSelection.selectIngredientForModification,
    removeIngredientSelection: ingredientSelection.removeIngredientSelection,
    customInstructions: ingredientSelection.customInstructions,
    setCustomInstructions: ingredientSelection.setCustomInstructions,
    isAiModifying: false, // We'll add this functionality in the combined hook
    handleStartModification: () => {} // Placeholder, will be implemented in the combined hook
  };

  // Still provide the combined context for backward compatibility
  return (
    <RecipeContext.Provider value={value}>
      <RecipeDataProvider value={recipeDataValue}>
        <ModificationProvider value={modificationValue}>
          <VersionProvider value={versionState}>
            {children}
          </VersionProvider>
        </ModificationProvider>
      </RecipeDataProvider>
    </RecipeContext.Provider>
  );
};

// Custom hook for accessing the recipe context
export const useRecipe = (): RecipeContextType => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipe must be used within a RecipeProvider");
  }
  return context;
};
