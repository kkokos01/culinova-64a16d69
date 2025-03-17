
import React from "react";
import { Ingredient } from "@/types";
import SelectedIngredientsPanel from "../SelectedIngredientsPanel";

interface IngredientSelectionSectionProps {
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onRemoveSelection: (id: string) => void;
}

const IngredientSelectionSection: React.FC<IngredientSelectionSectionProps> = ({
  selectedIngredients,
  onRemoveSelection
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-white mb-2">Selected Ingredients</h3>
      <SelectedIngredientsPanel
        selectedIngredients={selectedIngredients}
        onRemoveSelection={onRemoveSelection}
      />
    </div>
  );
};

export default IngredientSelectionSection;
