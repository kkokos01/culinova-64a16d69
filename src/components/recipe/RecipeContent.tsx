
import React from "react";
import { Recipe, Ingredient } from "@/types";
import { Plus, Minus, X } from "lucide-react";

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
  // Helper function to get the appropriate styling based on action
  const getIngredientStyles = (ingredient: Ingredient) => {
    if (!selectedIngredients.has(ingredient.id)) {
      return {
        container: "border-gray-100 hover:bg-gray-100",
        text: ""
      };
    }
    
    const action = selectedIngredients.get(ingredient.id)?.action;
    
    switch (action) {
      case "increase":
        return {
          container: "border-primary bg-green-50/70",
          text: "font-medium"
        };
      case "decrease":
        return {
          container: "border-amber-400 bg-amber-50/70",
          text: "font-medium"
        };
      case "remove":
        return {
          container: "border-red-400 bg-red-50/70",
          text: "line-through opacity-75"
        };
      default:
        return {
          container: "border-gray-100 hover:bg-gray-100",
          text: ""
        };
    }
  };

  // Handle click on the main ingredient area (not buttons) to deselect
  const handleIngredientClick = (ingredient: Ingredient, e: React.MouseEvent) => {
    // Only process if clicking on the main area (not the buttons)
    if ((e.target as HTMLElement).closest('.action-buttons') === null) {
      // If this ingredient is already selected, deselect it
      if (selectedIngredients.has(ingredient.id)) {
        onSelectIngredient(ingredient, null);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Ingredients */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
        <ul className="space-y-2 grid sm:grid-cols-2 gap-2">
          {recipe.ingredients?.map((ingredient) => {
            const styles = getIngredientStyles(ingredient);
            
            return (
              <li 
                key={ingredient.id} 
                className={`flex items-center p-2.5 rounded-md border transition-colors ${styles.container} cursor-pointer`}
                onClick={(e) => handleIngredientClick(ingredient, e)}
              >
                <div className="flex-1 min-w-0">
                  <div className={`flex items-baseline flex-wrap gap-x-2 ${styles.text}`}>
                    <span className="font-medium whitespace-nowrap">
                      {ingredient.amount} {ingredient.unit?.abbreviation}
                    </span>
                    <span className="truncate">{ingredient.food?.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 action-buttons">
                  <button
                    onClick={() => onSelectIngredient(ingredient, "increase")}
                    className={`p-1 rounded-full ${
                      selectedIngredients.get(ingredient.id)?.action === "increase" 
                        ? "bg-green-100 text-green-700" 
                        : "hover:bg-gray-200 text-green-600"
                    }`}
                    aria-label="Increase ingredient"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onSelectIngredient(ingredient, "decrease")}
                    className={`p-1 rounded-full ${
                      selectedIngredients.get(ingredient.id)?.action === "decrease" 
                        ? "bg-amber-100 text-amber-700" 
                        : "hover:bg-gray-200 text-amber-600"
                    }`}
                    aria-label="Decrease ingredient"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onSelectIngredient(ingredient, "remove")}
                    className={`p-1 rounded-full ${
                      selectedIngredients.get(ingredient.id)?.action === "remove" 
                        ? "bg-red-100 text-red-700" 
                        : "hover:bg-gray-200 text-red-600"
                    }`}
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
