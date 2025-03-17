
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
        // Handle the possibility of food and unit being arrays or objects
        const foodObj = ingredient.food ? 
          (Array.isArray(ingredient.food) ? ingredient.food[0] : ingredient.food) : null;
          
        const unitObj = ingredient.unit ? 
          (Array.isArray(ingredient.unit) ? ingredient.unit[0] : ingredient.unit) : null;
          
        console.log(`Ingredient ${index + 1}:`, {
          id: ingredient.id,
          food_id: ingredient.food_id,
          food: foodObj, // Now guaranteed to be an object or null, not an array
          foodName: foodObj ? foodObj.name || 'No food name' : 'No food name',
          amount: ingredient.amount,
          unit: unitObj ? unitObj.abbreviation || 'No unit' : 'No unit'
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
