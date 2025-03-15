
import React from "react";
import { Recipe, Ingredient } from "@/types";
import { Plus, Minus, X } from "lucide-react";

interface RecipeContentProps {
  recipe: Recipe;
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onSelectIngredient: (ingredient: Ingredient, action: "increase" | "decrease" | "remove") => void;
}

const RecipeContent: React.FC<RecipeContentProps> = ({ 
  recipe, 
  selectedIngredients, 
  onSelectIngredient 
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Ingredients */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
        <ul className="space-y-2 grid sm:grid-cols-2 gap-2">
          {recipe.ingredients?.map((ingredient) => {
            const isSelected = selectedIngredients.has(ingredient.id);
            
            return (
              <li 
                key={ingredient.id} 
                className={`flex items-center p-2.5 rounded-md border transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-gray-100 hover:bg-gray-100'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline flex-wrap gap-x-2">
                    <span className="font-medium whitespace-nowrap">
                      {ingredient.amount} {ingredient.unit?.abbreviation}
                    </span>
                    <span className="truncate">{ingredient.food?.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => onSelectIngredient(ingredient, "increase")}
                    className="p-1 rounded-full hover:bg-gray-200 text-green-600"
                    aria-label="Increase ingredient"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onSelectIngredient(ingredient, "decrease")}
                    className="p-1 rounded-full hover:bg-gray-200 text-amber-600"
                    aria-label="Decrease ingredient"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onSelectIngredient(ingredient, "remove")}
                    className="p-1 rounded-full hover:bg-gray-200 text-red-600"
                    aria-label="Remove ingredient"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
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
