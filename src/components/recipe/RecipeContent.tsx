
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

  // Make sure we have the ingredients and steps arrays
  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Ingredients */}
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
          Ingredients
        </h2>
        {ingredients.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-2">
            {ingredients.map((ingredient) => {
              if (!ingredient || !ingredient.id) return null;
              
              const styles = getIngredientStyles(ingredient);
              const foodName = ingredient.food?.name || "Unknown ingredient";
              
              return (
                <div 
                  key={ingredient.id} 
                  className={`flex items-center p-2 rounded-md border transition-colors ${styles.container} cursor-pointer h-full`}
                  onClick={(e) => handleIngredientClick(ingredient, e)}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-baseline gap-x-1.5 text-sm ${styles.text}`}>
                      <span className="font-medium whitespace-nowrap">
                        {ingredient.amount} {ingredient.unit?.abbreviation || ''}
                      </span>
                      <span className="truncate">{foodName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 ml-1.5 action-buttons shrink-0">
                    <button
                      onClick={() => onSelectIngredient(ingredient, "increase")}
                      className={`p-0.5 rounded-full ${
                        selectedIngredients.get(ingredient.id)?.action === "increase" 
                          ? "bg-green-100 text-green-700" 
                          : "hover:bg-gray-200 text-green-600"
                      }`}
                      aria-label="Increase ingredient"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectIngredient(ingredient, "decrease")}
                      className={`p-0.5 rounded-full ${
                        selectedIngredients.get(ingredient.id)?.action === "decrease" 
                          ? "bg-amber-100 text-amber-700" 
                          : "hover:bg-gray-200 text-amber-600"
                      }`}
                      aria-label="Decrease ingredient"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectIngredient(ingredient, "remove")}
                      className={`p-0.5 rounded-full ${
                        selectedIngredients.get(ingredient.id)?.action === "remove" 
                          ? "bg-red-100 text-red-700" 
                          : "hover:bg-gray-200 text-red-600"
                      }`}
                      aria-label="Remove ingredient"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 italic">No ingredients found for this recipe.</p>
        )}
      </div>
      
      {/* Steps */}
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
          Instructions
        </h2>
        {steps.length > 0 ? (
          <ol className="space-y-4">
            {steps.map((step) => (
              <li key={step.id} className="flex">
                <div className="flex-shrink-0 mr-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {step.order_number}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 text-sm">{step.instruction}</p>
                  {step.duration_minutes && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Approximately {step.duration_minutes} minutes
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-500 italic">No instructions found for this recipe.</p>
        )}
      </div>
    </div>
  );
};

export default RecipeContent;
