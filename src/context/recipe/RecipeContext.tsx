
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
  console.log("RecipeProvider initializing");
  
  // Use our custom hooks to manage different aspects of recipe state
  const recipeState = useRecipeState();
  console.log("recipeState initialized", recipeState);
  
  const ingredientSelection = useIngredientSelection();
  console.log("ingredientSelection initialized", ingredientSelection);
  
  const versionState = useRecipeVersions(recipeState.setRecipe);
  console.log("versionState initialized", versionState);

  // Combine all the state and functions into a single context value
  const value: RecipeContextType = {
    ...recipeState,
    ...ingredientSelection,
    ...versionState,
  };

  console.log("RecipeProvider rendering with value:", value);
  
  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};

// Custom hook for accessing the recipe context
export const useRecipe = (): RecipeContextType => {
  console.log("useRecipe called");
  const context = useContext(RecipeContext);
  if (context === undefined) {
    console.error("useRecipe must be used within a RecipeProvider");
    throw new Error("useRecipe must be used within a RecipeProvider");
  }
  console.log("useRecipe returning context:", context);
  return context;
};
