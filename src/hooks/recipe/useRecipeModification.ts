import { useState } from "react";
import { Ingredient, Recipe } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useRecipeModification = (recipe: Recipe | null, addTemporaryVersion: (name: string, recipe: Recipe) => any) => {
  const { toast } = useToast();
  
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>>(
    new Map()
  );
  const [customInstructions, setCustomInstructions] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [isAiModifying, setIsAiModifying] = useState(false);

  // Select an ingredient for modification
  const selectIngredientForModification = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    setSelectedIngredients(prev => {
      const newMap = new Map(prev);
      
      // If action is null, deselect the ingredient
      if (action === null) {
        newMap.delete(ingredient.id);
      } else {
        // Otherwise, set the action
        newMap.set(ingredient.id, { ingredient, action });
      }
      
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

  // Handle starting an AI-based modification
  const handleStartModification = async (modificationType: string) => {
    if (!recipe) return;
    
    setIsAiModifying(true);
    
    try {
      // Here we would normally call an AI API
      // For now, we'll just simulate a modification
      const ingredientActions = Array.from(selectedIngredients.entries())
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
          ...recipe,
          // In a real implementation, we would make actual AI modifications here
          title: `${recipe.title} (${modificationType})`
        };
        
        // Create a temporary version (not saved to DB yet)
        addTemporaryVersion(`${modificationType} Version`, modifiedRecipe);
        
        setIsModified(true);
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

  return {
    selectedIngredient,
    setSelectedIngredient,
    selectedIngredients,
    selectIngredientForModification,
    removeIngredientSelection,
    customInstructions,
    setCustomInstructions,
    isModified,
    setIsModified,
    isAiModifying,
    setIsAiModifying,
    handleStartModification
  };
};
