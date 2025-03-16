
import React, { createContext, useContext, useState } from "react";
import { Recipe, Ingredient } from "@/types";
import { v4 as uuidv4 } from 'uuid';

// Define the version type
export interface RecipeVersion {
  id: string;
  name: string;
  recipe: Recipe;
  isActive: boolean;
}

// Define the context type
interface RecipeContextType {
  recipe: Recipe | null;
  setRecipe: (recipe: Recipe) => void;
  originalRecipe: Recipe | null;
  setOriginalRecipe: (recipe: Recipe) => void;
  selectedIngredient: Ingredient | null;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  selectIngredientForModification: (ingredient: Ingredient, action: "increase" | "decrease" | "remove") => void;
  removeIngredientSelection: (id: string) => void;
  customInstructions: string;
  setCustomInstructions: (instructions: string) => void;
  isModified: boolean;
  setIsModified: (isModified: boolean) => void;
  resetToOriginal: () => void;
  recipeVersions: RecipeVersion[];
  activeVersionId: string;
  addRecipeVersion: (name: string, recipe: Recipe) => void;
  setActiveVersion: (versionId: string) => void;
  renameVersion: (versionId: string, newName: string) => void;
  deleteVersion: (versionId: string) => void;
}

// Create context with default values
const RecipeContext = createContext<RecipeContextType>({
  recipe: null,
  setRecipe: () => {},
  originalRecipe: null,
  setOriginalRecipe: () => {},
  selectedIngredient: null,
  setSelectedIngredient: () => {},
  selectedIngredients: new Map(),
  selectIngredientForModification: () => {},
  removeIngredientSelection: () => {},
  customInstructions: "",
  setCustomInstructions: () => {},
  isModified: false,
  setIsModified: () => {},
  resetToOriginal: () => {},
  recipeVersions: [],
  activeVersionId: "",
  addRecipeVersion: () => {},
  setActiveVersion: () => {},
  renameVersion: () => {},
  deleteVersion: () => {},
});

// Provider component
export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [originalRecipe, setOriginalRecipe] = useState<Recipe | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>>(
    new Map()
  );
  const [customInstructions, setCustomInstructions] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [recipeVersions, setRecipeVersions] = useState<RecipeVersion[]>([]);

  // Calculate active version ID from the versions array
  const activeVersionId = recipeVersions.find(v => v.isActive)?.id || "";

  // Select an ingredient for modification
  const selectIngredientForModification = (ingredient: Ingredient, action: "increase" | "decrease" | "remove") => {
    setSelectedIngredients(prev => {
      const newMap = new Map(prev);
      newMap.set(ingredient.id, { ingredient, action });
      return newMap;
    });
  };

  // Remove an ingredient from the selection
  const removeIngredientSelection = (id: string) => {
    setSelectedIngredients(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  // Reset to original recipe
  const resetToOriginal = () => {
    if (originalRecipe) {
      setRecipe(originalRecipe);
      setIsModified(false);
    }
  };

  // Add a new recipe version
  const addRecipeVersion = (name: string, recipe: Recipe) => {
    // Deactivate all existing versions
    const updatedVersions = recipeVersions.map(version => ({
      ...version,
      isActive: false
    }));
    
    // Create a new version and set it as active
    const newVersion: RecipeVersion = {
      id: uuidv4(),
      name,
      recipe: { ...recipe },
      isActive: true
    };
    
    setRecipeVersions([...updatedVersions, newVersion]);
  };

  // Set active version
  const setActiveVersion = (versionId: string) => {
    const updatedVersions = recipeVersions.map(version => {
      const isActive = version.id === versionId;
      // If this version is being activated, also update the current recipe
      if (isActive) {
        setRecipe(version.recipe);
      }
      return {
        ...version,
        isActive
      };
    });
    
    setRecipeVersions(updatedVersions);
  };

  // Rename version
  const renameVersion = (versionId: string, newName: string) => {
    const updatedVersions = recipeVersions.map(version => 
      version.id === versionId 
        ? { ...version, name: newName } 
        : version
    );
    
    setRecipeVersions(updatedVersions);
  };

  // Delete version
  const deleteVersion = (versionId: string) => {
    // Find if the version being deleted is active
    const isActiveVersion = recipeVersions.find(v => v.id === versionId)?.isActive || false;
    
    // Filter out the version to delete
    const remainingVersions = recipeVersions.filter(version => version.id !== versionId);
    
    // If we deleted the active version, make the first remaining version active
    if (isActiveVersion && remainingVersions.length > 0) {
      remainingVersions[0].isActive = true;
      setRecipe(remainingVersions[0].recipe);
    }
    
    setRecipeVersions(remainingVersions);
  };

  return (
    <RecipeContext.Provider
      value={{
        recipe,
        setRecipe,
        originalRecipe,
        setOriginalRecipe,
        selectedIngredient,
        setSelectedIngredient,
        selectedIngredients,
        selectIngredientForModification,
        removeIngredientSelection,
        customInstructions,
        setCustomInstructions,
        isModified,
        setIsModified,
        resetToOriginal,
        recipeVersions,
        activeVersionId,
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

// Hook to use the recipe context
export const useRecipe = () => useContext(RecipeContext);
