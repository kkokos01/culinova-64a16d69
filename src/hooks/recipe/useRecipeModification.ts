import { useState } from "react";
import { Ingredient, Recipe } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useRecipeModification = (recipe: Recipe | null, addTemporaryVersion: ((name: string, recipe: Recipe) => any) | null) => {
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
    console.log("Selecting ingredient:", ingredient.id, action);
    
    setSelectedIngredients(prev => {
      const newMap = new Map(prev);
      
      // If action is null, deselect the ingredient
      if (action === null) {
        console.log("Removing ingredient selection:", ingredient.id);
        newMap.delete(ingredient.id);
      } else {
        // Otherwise, set the action
        console.log("Setting ingredient action:", ingredient.id, action);
        newMap.set(ingredient.id, { ingredient, action });
      }
      
      return newMap;
    });
  };

  // Remove an ingredient from the selection
  const removeIngredientSelection = (id: string) => {
    console.log("Removing ingredient selection by ID:", id);
    
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
    console.log("Starting modification with type:", modificationType);
    console.log("Selected ingredients:", Array.from(selectedIngredients.entries()));
    
    try {
      // Here we would normally call an AI API
      // For now, we'll just simulate a modification
      const ingredientActions = Array.from(selectedIngredients.entries())
        .map(([_, { ingredient, action }]) => `${action} ${ingredient.food?.name}`)
        .join(", ");
      
      const modificationMessage = ingredientActions 
        ? `Starting modification with changes: ${ingredientActions}`
        : `Starting modification with custom instructions: ${modificationType}`;
      
      toast({
        title: "AI Modification Started",
        description: modificationMessage,
      });
      
      // Toggle modified status on (we would normally wait for the API response)
      setTimeout(() => {
        // In a real implementation, we would apply AI changes to the recipe
        setIsModified(true);
        setIsAiModifying(false);
        
        toast({
          title: "Recipe Modified",
          description: "Recipe has been successfully modified with AI",
        });
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

  // Handle saving changes
  const handleSaveChanges = async () => {
    try {
      toast({
        title: "Changes Saved",
        description: "Your modifications have been saved.",
      });
      
      setIsModified(false);
    } catch (error) {
      console.error("Error saving modifications:", error);
      
      toast({
        title: "Error",
        description: "Failed to save modifications.",
        variant: "destructive"
      });
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
    handleStartModification,
    handleSaveChanges
  };
};
