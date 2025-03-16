
import React, { createContext, useContext } from "react";
import { Recipe, Ingredient } from "@/types";
import { useRecipeState } from "./useRecipeState";
import { useIngredientSelection } from "./useIngredientSelection";
import { useRecipeVersions } from "./useRecipeVersions";
import { RecipeContextType } from "./types";

// Create the context with default values
const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// Provider component that wraps the children
export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use our custom hooks to manage different aspects of recipe state
  const recipeState = useRecipeState();
  const ingredientSelection = useIngredientSelection();
  const versionState = useRecipeVersions(recipeState.setRecipe);

  // Combine all the state and functions into a single context value
  const value: RecipeContextType = {
    ...recipeState,
    ...ingredientSelection,
    ...versionState,
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
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
