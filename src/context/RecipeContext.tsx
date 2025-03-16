
import React, { createContext, useContext, useState } from "react";
import { Recipe, Ingredient } from "@/types";

// Define a type for recipe versions
export type RecipeVersion = {
  id: string;
  name: string;
  recipe: Recipe;
  isActive: boolean;
};

type RecipeContextType = {
  recipe: Recipe | null;
  originalRecipe: Recipe | null;
  recipeVersions: RecipeVersion[];
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
  // Added new functions to support recipe versions
  addRecipeVersion: (name: string, recipe: Recipe) => void;
  setActiveVersion: (id: string) => void;
  renameVersion: (id: string, newName: string) => void;
  deleteVersion: (id: string) => void;
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
  const [recipeVersions, setRecipeVersions] = useState<RecipeVersion[]>([]);

  const resetToOriginal = () => {
    if (originalRecipe) {
      setRecipe(originalRecipe);
      setIsModified(false);
      
      // Set the original version as active
      const originalVersionId = recipeVersions.find(v => v.name === "Original")?.id;
      if (originalVersionId) {
        setActiveVersion(originalVersionId);
      }
    }
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

  // New functions for recipe versions
  const addRecipeVersion = (name: string, newRecipe: Recipe) => {
    const newVersion: RecipeVersion = {
      id: crypto.randomUUID(),
      name,
      recipe: newRecipe,
      isActive: true
    };

    setRecipeVersions(prev => {
      // Set all versions to inactive
      const updatedVersions = prev.map(v => ({...v, isActive: false}));
      // Add the new version
      return [...updatedVersions, newVersion];
    });

    // Set the new recipe as current
    setRecipe(newRecipe);
  };

  const setActiveVersion = (id: string) => {
    setRecipeVersions(prev => {
      const updatedVersions = prev.map(v => ({
        ...v,
        isActive: v.id === id
      }));
      
      // Update the current recipe
      const activeVersion = updatedVersions.find(v => v.id === id);
      if (activeVersion) {
        setRecipe(activeVersion.recipe);
      }
      
      return updatedVersions;
    });
  };

  const renameVersion = (id: string, newName: string) => {
    setRecipeVersions(prev => 
      prev.map(v => v.id === id ? {...v, name: newName} : v)
    );
  };

  const deleteVersion = (id: string) => {
    setRecipeVersions(prev => {
      const filteredVersions = prev.filter(v => v.id !== id);
      
      // If we're deleting the active version, set the first available one as active
      const wasActive = prev.find(v => v.id === id)?.isActive;
      
      if (wasActive && filteredVersions.length > 0) {
        // Set the original as active if available, otherwise the first version
        const originalVersion = filteredVersions.find(v => v.name === "Original");
        const newActiveVersion = originalVersion || filteredVersions[0];
        
        newActiveVersion.isActive = true;
        setRecipe(newActiveVersion.recipe);
      }
      
      return filteredVersions;
    });
  };

  return (
    <RecipeContext.Provider
      value={{
        recipe,
        originalRecipe,
        recipeVersions,
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
        selectIngredientForModification,
        removeIngredientSelection,
        setCustomInstructions,
        addRecipeVersion,
        setActiveVersion,
        renameVersion,
        deleteVersion,
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
