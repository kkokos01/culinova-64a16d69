
import React, { createContext, useContext, useState } from "react";
import { Recipe, Ingredient } from "@/types";

type RecipeContextType = {
  recipe: Recipe | null;
  originalRecipe: Recipe | null;
  isModified: boolean;
  isProcessingAI: boolean;
  selectedIngredient: Ingredient | null;
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  customInstructions: string;
  setRecipe: (recipe: Recipe | null) => void;
  setOriginalRecipe: (recipe: Recipe | null) => void;
  setIsModified: (isModified: boolean) => void;
  setIsProcessingAI: (isProcessing: boolean) => void;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
  resetToOriginal: () => void;
  selectIngredientForModification: (ingredient: Ingredient, action: "increase" | "decrease" | "remove") => void;
  removeIngredientSelection: (id: string) => void;
  setCustomInstructions: (instructions: string) => void;
  // Added new function to support AI modifications
  applyAIModification: (modifiedRecipe: Recipe) => void;
};

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [originalRecipe, setOriginalRecipe] = useState<Recipe | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<
    Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>
  >(new Map());
  const [customInstructions, setCustomInstructions] = useState("");

  const resetToOriginal = () => {
    if (originalRecipe) {
      setRecipe(originalRecipe);
      setIsModified(false);
    }
  };

  const applyAIModification = (modifiedRecipe: Recipe) => {
    setRecipe(modifiedRecipe);
    setIsModified(true);
    setIsProcessingAI(false);
  };

  const selectIngredientForModification = (ingredient: Ingredient, action: "increase" | "decrease" | "remove") => {
    setSelectedIngredients(prev => {
      const newMap = new Map(prev);
      newMap.set(ingredient.id, { ingredient, action });
      return newMap;
    });
  };

  const removeIngredientSelection = (id: string) => {
    setSelectedIngredients(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  return (
    <RecipeContext.Provider
      value={{
        recipe,
        originalRecipe,
        isModified,
        isProcessingAI,
        selectedIngredient,
        selectedIngredients,
        customInstructions,
        setRecipe,
        setOriginalRecipe,
        setIsModified,
        setIsProcessingAI,
        setSelectedIngredient,
        resetToOriginal,
        applyAIModification,
        selectIngredientForModification,
        removeIngredientSelection,
        setCustomInstructions,
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
