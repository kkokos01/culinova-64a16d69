
import React from "react";
import { Recipe, Ingredient } from "@/types";

interface RecipeContentProps {
  recipe: Recipe;
  onSelectIngredient: (ingredient: Ingredient) => void;
}

const RecipeContent: React.FC<RecipeContentProps> = ({ recipe, onSelectIngredient }) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Ingredients */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
        <ul className="space-y-2 grid sm:grid-cols-2 gap-2">
          {recipe.ingredients?.map((ingredient) => (
            <li 
              key={ingredient.id} 
              className="flex items-center p-2.5 rounded-md hover:bg-gray-100 cursor-pointer transition-colors border border-gray-100"
              onClick={() => onSelectIngredient(ingredient)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline flex-wrap gap-x-2">
                  <span className="font-medium whitespace-nowrap">{ingredient.amount} {ingredient.unit?.abbreviation}</span>
                  <span className="truncate">{ingredient.food?.name}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Steps */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
        <ol className="space-y-6">
          {recipe.steps?.map((step) => (
            <li key={step.id} className="flex">
              <div className="flex-shrink-0 mr-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {step.order_number}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 text-sm sm:text-base">{step.instruction}</p>
                {step.duration_minutes && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Approximately {step.duration_minutes} minutes
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default RecipeContent;
