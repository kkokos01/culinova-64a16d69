
import React, { useEffect } from "react";
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
  useEffect(() => {
    // Debug log for recipe ingredients with proper field names
    console.log("RecipeContent rendering with recipe title:", recipe.title);
    console.log("RecipeContent rendering with ingredients:", recipe.ingredients);
    
    // Validate ingredient data structure
    if (recipe.ingredients) {
      recipe.ingredients.forEach((ingredient, index) => {
        // Use our normalization functions
        const foodObj = normalizeFood(ingredient.food);
        const unitObj = normalizeUnit(ingredient.unit);
          
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
  }, [recipe, recipe.title, recipe.ingredients]);

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

export default React.memo(RecipeContent, (prevProps, nextProps) => {
  // Only re-render if the recipe ID changes or if the recipe title changes
  // This ensures we update the component when switching between versions
  return (
    prevProps.recipe.id === nextProps.recipe.id &&
    prevProps.recipe.title === nextProps.recipe.title
  );
});
