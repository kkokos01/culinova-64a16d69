
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
    // Debug log for recipe ingredients with proper field names
    console.log("RecipeContent rendering with ingredients:", recipe.ingredients);
    
    // Validate ingredient data structure
    if (recipe.ingredients) {
      recipe.ingredients.forEach((ingredient, index) => {
        console.log(`Ingredient ${index + 1}:`, {
          id: ingredient.id,
          food_id: ingredient.food_id,
          food: ingredient.food, // Expect object, not array
          foodName: ingredient.food ? ingredient.food.name || 'No food name' : 'No food name',
          amount: ingredient.amount,
          unit: ingredient.unit ? ingredient.unit.abbreviation || 'No unit' : 'No unit'
        });
      });
    }
  }, [recipe.ingredients]);

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

export default RecipeContent;
