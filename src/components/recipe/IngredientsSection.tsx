
import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Ingredient } from "@/types";
import IngredientItem from "./IngredientItem";

interface IngredientsSectionProps {
  ingredients: Ingredient[];
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onSelectIngredient: (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => void;
}

const IngredientsSection: React.FC<IngredientsSectionProps> = ({
  ingredients,
  selectedIngredients,
  onSelectIngredient
}) => {
  // Check for test data
  const hasTestData = ingredients.some(i => 
    i?.food?.name?.includes('Test Food') || 
    i?.food?.name?.includes('Parent Food')
  );

  // Check if we have ingredients without food details
  const hasIncompleteData = ingredients.some(i => !i.food || !i.food.name);

  // Check for non-validated ingredients
  const hasNonValidated = ingredients.some(i => 
    i?.food && i.food.is_validated === false
  );

  // Count valid ingredients (with both food and unit information)
  const validIngredientCount = ingredients.filter(i => 
    i?.food?.name && i?.unit?.abbreviation
  ).length;

  return (
    <div className="mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
        Ingredients
        {validIngredientCount > 0 && 
          <span className="text-sm font-normal ml-2 text-gray-500">
            ({validIngredientCount})
          </span>
        }
      </h2>
      
      {hasTestData && (
        <div className="flex items-center mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
          <AlertTriangle className="text-amber-500 mr-2 h-5 w-5 flex-shrink-0" />
          <p className="text-amber-700 text-sm">
            This recipe contains test data. The ingredients shown are placeholder names generated by the system.
          </p>
        </div>
      )}
      
      {hasIncompleteData && (
        <div className="flex items-center mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
          <AlertTriangle className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />
          <p className="text-red-700 text-sm">
            Some ingredients are missing food information. This may indicate a database connectivity issue or improper food references.
          </p>
        </div>
      )}
      
      {hasNonValidated && (
        <div className="flex items-center mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <CheckCircle2 className="text-blue-500 mr-2 h-5 w-5 flex-shrink-0" />
          <p className="text-blue-700 text-sm">
            Some ingredients contain AI-suggested foods that have not yet been validated. You may want to review these items.
          </p>
        </div>
      )}
      
      {ingredients.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-2">
          {ingredients.map((ingredient) => {
            if (!ingredient || !ingredient.id) return null;
            
            const selected = selectedIngredients.has(ingredient.id);
            const action = selectedIngredients.get(ingredient.id)?.action;
            
            return (
              <IngredientItem
                key={ingredient.id}
                ingredient={ingredient}
                isSelected={selected}
                selectedAction={action}
                onSelectIngredient={onSelectIngredient}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 italic">No ingredients found for this recipe.</p>
      )}
    </div>
  );
};

export default IngredientsSection;
