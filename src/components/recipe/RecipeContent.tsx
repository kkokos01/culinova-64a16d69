
import React, { useEffect, useCallback } from "react";
import { Recipe, Ingredient } from "@/types";
import IngredientsSection from "./IngredientsSection";
import StepsSection from "./StepsSection";
import { normalizeFood, normalizeUnit } from "@/api/types/supabaseTypes";

interface RecipeContentProps {
  recipe: Recipe;
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onSelectIngredient: (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => void;
}

const RecipeContent: React.FC<RecipeContentProps> = ({ 
  recipe, 
  selectedIngredients, 
  onSelectIngredient 
}) => {
  // Log recipe changes for debugging
  const logRecipeDetails = useCallback(() => {
    console.log("RecipeContent rendering with recipe title:", recipe.title);
    console.log("RecipeContent rendering with ingredients:", recipe.ingredients?.length || 0);
    
    // Validate ingredient data structure
    if (recipe.ingredients) {
      recipe.ingredients.forEach((ingredient, index) => {
        // Use text-based ingredient names instead of structured relationships
        const foodName = ingredient.food_name || "Unknown ingredient";
        const unitName = ingredient.unit_name || "";
          
        console.log(`Ingredient ${index + 1}:`, {
          id: ingredient.id,
          food_id: ingredient.food_id,
          foodName: foodName,
          amount: ingredient.amount,
          unit: unitName || 'No unit'
        });
      });
    }
    
    // Log selected ingredients for debugging
    console.log("Selected ingredients:", 
      Array.from(selectedIngredients.entries()).map(([id, data]) => ({
        id,
        action: data.action,
        name: data.ingredient.food_name || 'Unknown ingredient'
      }))
    );
  }, [recipe, selectedIngredients]);

  useEffect(() => {
    logRecipeDetails();
  }, [recipe, logRecipeDetails]);

  // Make sure we have the ingredients and steps arrays
  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];

  return (
    <div className="max-w-4xl mx-auto">
      <IngredientsSection 
        ingredients={ingredients} 
        selectedIngredients={selectedIngredients}
        onSelectIngredient={onSelectIngredient}
      />
      
      <StepsSection steps={steps} />
    </div>
  );
};

// Use a deep equality check for the recipe to ensure re-rendering when content changes
export default React.memo(RecipeContent, (prevProps, nextProps) => {
  // Always re-render if the recipe ID changes
  if (prevProps.recipe.id !== nextProps.recipe.id) {
    return false;
  }
  
  // Also re-render if the title or description changes
  if (prevProps.recipe.title !== nextProps.recipe.title ||
      prevProps.recipe.description !== nextProps.recipe.description) {
    return false;
  }
  
  // Check if ingredients or steps have changed
  const prevIngredientsLength = prevProps.recipe.ingredients?.length || 0;
  const nextIngredientsLength = nextProps.recipe.ingredients?.length || 0;
  
  if (prevIngredientsLength !== nextIngredientsLength) {
    return false;
  }
  
  const prevStepsLength = prevProps.recipe.steps?.length || 0;
  const nextStepsLength = nextProps.recipe.steps?.length || 0;
  
  if (prevStepsLength !== nextStepsLength) {
    return false;
  }
  
  // Also re-render if selectedIngredients has changed
  if (prevProps.selectedIngredients !== nextProps.selectedIngredients) {
    return false;
  }
  
  // Return true to prevent re-rendering if no significant changes
  return true;
});
