
import React, { createContext, useContext, ReactNode } from "react";
import { Recipe } from "@/types";

export interface RecipeDataContextType {
  recipe: Recipe | null;
  setRecipe: (recipe: Recipe) => void;
  originalRecipe: Recipe | null;
  setOriginalRecipe: (recipe: Recipe) => void;
  isModified: boolean;
  setIsModified: (isModified: boolean) => void;
  resetToOriginal: () => void;
}

const RecipeDataContext = createContext<RecipeDataContextType | undefined>(undefined);

export const RecipeDataProvider: React.FC<{ 
  children: ReactNode;
  value: RecipeDataContextType;
}> = ({ children, value }) => {
  return (
    <RecipeDataContext.Provider value={value}>
      {children}
    </RecipeDataContext.Provider>
  );
};

export const useRecipeData = (): RecipeDataContextType => {
  const context = useContext(RecipeDataContext);
  if (context === undefined) {
    throw new Error("useRecipeData must be used within a RecipeDataProvider");
  }
  return context;
};
