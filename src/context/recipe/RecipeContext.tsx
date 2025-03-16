
import React, { createContext, useContext } from "react";
import { RecipeContextType } from "./types";
import { useRecipeState } from "./useRecipeState";
import { useIngredientSelection } from "./useIngredientSelection";
import { useRecipeVersions } from "./useRecipeVersions";

// Create context with default empty values
const RecipeContext = createContext<RecipeContextType>({} as RecipeContextType);

// Provider component
export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use our custom hooks
  const recipeState = useRecipeState();
  const ingredientSelection = useIngredientSelection();
  const recipeVersions = useRecipeVersions(recipeState.setRecipe);

  // Combine all the values from our hooks
  const contextValue: RecipeContextType = {
    ...recipeState,
    ...ingredientSelection,
    ...recipeVersions
  };

  return (
    <RecipeContext.Provider value={contextValue}>
      {children}
    </RecipeContext.Provider>
  );
};

// Hook to use the recipe context
export const useRecipe = () => useContext(RecipeContext);
