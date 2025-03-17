
import React, { useContext, useState } from "react";
import { Recipe, Ingredient } from "@/types";
import { useRecipeState } from "./useRecipeState";
import { useIngredientSelection } from "./useIngredientSelection";
import { useRecipeVersioning } from "@/hooks/recipe/useRecipeVersioning";
import { RecipeContextType } from "./types";
import { RecipeDataProvider } from "./RecipeDataContext";
import { ModificationProvider } from "./ModificationContext";
import { VersionProvider } from "./VersionContext";
import { useToast } from "@/hooks/use-toast";

// Create the context with default values
const RecipeContext = React.createContext<RecipeContextType | undefined>(undefined);

// Provider component that wraps the children
export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log("RecipeProvider initializing");
  
  // Use our custom hooks to manage different aspects of recipe state
  const recipeState = useRecipeState();
  
  const ingredientSelection = useIngredientSelection();
  
  const versionState = useRecipeVersioning(recipeState.setRecipe);
  
  // Add AI modification state
  const [isAiModifying, setIsAiModifying] = useState(false);
  const { toast } = useToast();

  // Handle starting an AI-based modification
  const handleStartModification = async (modificationType: string) => {
    if (!recipeState.recipe) return;
    
    setIsAiModifying(true);
    
    try {
      // Here we would normally call an AI API
      // For now, we'll just simulate a modification
      const ingredientActions = Array.from(ingredientSelection.selectedIngredients.entries())
        .map(([_, { ingredient, action }]) => `${action} ${ingredient.food?.name}`)
        .join(", ");
      
      const modificationMessage = ingredientActions 
        ? `Starting ${modificationType} modification with changes: ${ingredientActions}`
        : `Starting ${modificationType} modification...`;
      
      toast({
        title: "AI Modification Started",
        description: modificationMessage,
      });
      
      // Toggle modified status on (we would normally wait for the API response)
      setTimeout(() => {
        // Create a temporary version with the modifications
        // In a real implementation, we would apply AI changes to the recipe
        const modifiedRecipe = {
          ...recipeState.recipe!,
          // In a real implementation, we would make actual AI modifications here
          title: `${recipeState.recipe!.title} (${modificationType})`
        };
        
        // Create a temporary version (not saved to DB yet)
        versionState.addTemporaryVersion(`${modificationType} Version`, modifiedRecipe);
        
        recipeState.setIsModified(true);
        setIsAiModifying(false);
      }, 1500);
    } catch (error) {
      console.error("Error during AI modification:", error);
      toast({
        title: "Error",
        description: "Failed to modify recipe with AI",
        variant: "destructive"
      });
      setIsAiModifying(false);
    }
  };

  // Combine all the state and functions into a single context value
  const value: RecipeContextType = {
    ...recipeState,
    ...ingredientSelection,
    ...versionState,
    isAiModifying,
    setIsAiModifying,
    handleStartModification
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
    isAiModifying,
    setIsAiModifying,
    handleStartModification
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
