
import { useState } from "react";
import { Recipe } from "@/types";

export function useRecipeState() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [originalRecipe, setOriginalRecipe] = useState<Recipe | null>(null);
  const [isModified, setIsModified] = useState(false);

  // Reset to original recipe
  const resetToOriginal = () => {
    if (originalRecipe) {
      setRecipe(originalRecipe);
      setIsModified(false);
    }
  };

  return {
    recipe,
    setRecipe,
    originalRecipe,
    setOriginalRecipe,
    isModified,
    setIsModified,
    resetToOriginal
  };
}
