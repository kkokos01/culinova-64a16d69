
import React, { useEffect } from "react";
import { Recipe, Ingredient } from "@/types";
import IngredientsSection from "./IngredientsSection";
import StepsSection from "./StepsSection";

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
  useEffect(() => {
    // Debug log for recipe ingredients
    console.log("RecipeContent rendering with ingredients:", recipe.ingredients);
    
    // Validate ingredient data structure
    if (recipe.ingredients) {
      recipe.ingredients.forEach((ingredient, index) => {
        console.log(`Ingredient ${index + 1}:`, {
          id: ingredient.id,
          food_id: ingredient.food_id,
          food: ingredient.food,
          foodName: ingredient.food?.name || 'No food name',
          amount: ingredient.amount,
          unit: ingredient.unit?.abbreviation || 'No unit'
        });
      });
    }
  }, [recipe.ingredients]);

  // Make sure we have the ingredients and steps arrays
  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];

  // Normalize ingredient data to handle both direct and joined structures
  const normalizedIngredients = ingredients.map(ingredient => {
    // Ensure we have a properly structured ingredient
    return {
      ...ingredient,
      // If food is an object but not an array, use it directly
      food: ingredient.food && typeof ingredient.food === 'object' && !Array.isArray(ingredient.food) 
        ? ingredient.food 
        : undefined,
      // If unit is an object but not an array, use it directly
      unit: ingredient.unit && typeof ingredient.unit === 'object' && !Array.isArray(ingredient.unit)
        ? ingredient.unit
        : undefined
    };
  });

  return (
    <div className="max-w-4xl mx-auto">
      <IngredientsSection 
        ingredients={normalizedIngredients} 
        selectedIngredients={selectedIngredients}
        onSelectIngredient={onSelectIngredient}
      />
      
      <StepsSection steps={steps} />
    </div>
  );
};

export default RecipeContent;
