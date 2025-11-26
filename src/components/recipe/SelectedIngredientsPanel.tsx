
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
    return (
      <p className="text-white/70 text-sm italic">
        Select ingredients from the recipe to modify them
      </p>
    );
  }
  
  // Helper function to get badge styling based on action
  const getBadgeStyles = (action: "increase" | "decrease" | "remove") => {
    switch (action) {
      case "increase":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "decrease":
        return "bg-amber-500 hover:bg-amber-600 text-white";
      case "remove":
        return "bg-red-500 hover:bg-red-600 text-white";
      default:
        return "";
    }
  };
  
  // Helper function to get text description based on action
  const getActionText = (action: "increase" | "decrease" | "remove") => {
    switch (action) {
      case "increase":
        return "Add";
      case "decrease":
        return "Reduce";
      case "remove":
        return "Remove";
      default:
        return "";
    }
  };
  
  return (
    <div className="space-y-2">
      {Array.from(selectedIngredients.entries()).map(([id, { ingredient, action }]) => (
        <div key={id} className="flex items-start justify-between bg-white/10 p-2 rounded border border-white/20 text-sm text-white">
          <div className="flex items-start gap-2 min-w-0 flex-grow mr-2">
            <Badge className={`shrink-0 mt-0.5 ${getBadgeStyles(action)}`}>
              {action === "increase" ? <Plus className="h-3 w-3" /> : 
               action === "decrease" ? <Minus className="h-3 w-3" /> : 
               <X className="h-3 w-3" />}
            </Badge>
            <span className="break-words">
              <span className="font-medium">{getActionText(action)}</span>{" "}
              {ingredient.food_name || "Unknown ingredient"}
            </span>
          </div>
          <button 
            onClick={() => onRemoveSelection(id)}
            className="ml-2 text-white/70 hover:text-white flex-shrink-0"
            aria-label="Remove selection"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default SelectedIngredientsPanel;
