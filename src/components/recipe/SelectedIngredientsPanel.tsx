
import React from "react";
import { Ingredient } from "@/types";
import { Plus, Minus, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SelectedIngredientsPanelProps {
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onRemoveSelection: (id: string) => void;
}

const SelectedIngredientsPanel: React.FC<SelectedIngredientsPanelProps> = ({ 
  selectedIngredients, 
  onRemoveSelection 
}) => {
  if (selectedIngredients.size === 0) {
    return null;
  }
  
  return (
    <div className="mt-4 border border-dashed border-gray-200 rounded-md p-3 bg-gray-50">
      <h3 className="text-sm font-medium mb-2">Selected Ingredients</h3>
      <div className="space-y-2">
        {Array.from(selectedIngredients.entries()).map(([id, { ingredient, action }]) => (
          <div key={id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Badge className={`shrink-0 ${
                action === "increase" ? "bg-green-500" : 
                action === "decrease" ? "bg-amber-500" : 
                "bg-red-500"
              }`}>
                {action === "increase" ? <Plus className="h-3 w-3" /> : 
                 action === "decrease" ? <Minus className="h-3 w-3" /> : 
                 <X className="h-3 w-3" />}
              </Badge>
              <span className="truncate">
                {ingredient.amount} {ingredient.unit?.abbreviation} {ingredient.food?.name}
              </span>
            </div>
            <button 
              onClick={() => onRemoveSelection(id)}
              className="ml-2 text-gray-400 hover:text-red-500"
              aria-label="Remove selection"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedIngredientsPanel;
