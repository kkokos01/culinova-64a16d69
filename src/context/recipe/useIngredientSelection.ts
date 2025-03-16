import { useState } from "react";
import { Ingredient } from "@/types";

export function useIngredientSelection() {
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>>(
    new Map()
  );
  const [customInstructions, setCustomInstructions] = useState("");

  // Select an ingredient for modification - handles null action for deselection
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

  return {
    selectedIngredient,
    setSelectedIngredient,
    selectedIngredients,
    selectIngredientForModification,
    removeIngredientSelection,
    customInstructions,
    setCustomInstructions
  };
}
