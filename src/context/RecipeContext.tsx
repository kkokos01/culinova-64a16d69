
import React, { createContext, useContext, useState } from "react";
import { Recipe, Ingredient } from "@/types";

type RecipeContextType = {
  recipe: Recipe | null;
  originalRecipe: Recipe | null;
  isModified: boolean;
  isProcessingAI: boolean;
  selectedIngredient: Ingredient | null;
  setRecipe: (recipe: Recipe | null) => void;
  setOriginalRecipe: (recipe: Recipe | null) => void;
  setIsModified: (isModified: boolean) => void;
  setIsProcessingAI: (isProcessing: boolean) => void;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
  resetToOriginal: () => void;
};

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [originalRecipe, setOriginalRecipe] = useState<Recipe | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const resetToOriginal = () => {
    if (originalRecipe) {
      setRecipe(originalRecipe);
      setIsModified(false);
    }
  };

  return (
    <RecipeContext.Provider
      value={{
        recipe,
        originalRecipe,
        isModified,
        isProcessingAI,
        selectedIngredient,
        setRecipe,
        setOriginalRecipe,
        setIsModified,
        setIsProcessingAI,
        setSelectedIngredient,
        resetToOriginal,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipe = (): RecipeContextType => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipe must be used within a RecipeProvider");
  }
  return context;
};
