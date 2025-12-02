
import React from "react";
import { Ingredient } from "@/types";
import { Plus, Minus, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface IngredientItemProps {
  ingredient: Ingredient;
  isSelected: boolean;
  selectedAction?: "increase" | "decrease" | "remove";
  onSelectIngredient: (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => void;
  scaledAmount?: string;
}

const IngredientItem: React.FC<IngredientItemProps> = ({
  ingredient,
  isSelected,
  selectedAction,
  onSelectIngredient,
  scaledAmount
}) => {
  // Helper function to get the appropriate styling based on action
  const getIngredientStyles = () => {
    if (!isSelected) {
      return {
        container: "border-gray-100 hover:bg-gray-100",
        text: ""
      };
    }
    
    switch (selectedAction) {
      case "increase":
        return {
          container: "border-green-400 bg-green-50",
          text: "font-medium text-green-700"
        };
      case "decrease":
        return {
          container: "border-amber-400 bg-amber-50",
          text: "font-medium text-amber-700"
        };
      case "remove":
        return {
          container: "border-red-400 bg-red-50",
          text: "line-through opacity-75 text-red-700"
        };
      default:
        return {
          container: "border-gray-100 hover:bg-gray-100",
          text: ""
        };
    }
  };

  // Handle click on the main ingredient area (not buttons) to deselect
  const handleIngredientClick = (e: React.MouseEvent) => {
    // Only process if clicking on the main area (not the buttons)
    if ((e.target as HTMLElement).closest('.action-buttons') === null) {
      // If this ingredient is already selected, deselect it
      if (isSelected) {
        onSelectIngredient(ingredient, null);
      }
    }
  };

  const styles = getIngredientStyles();
  
  // Use text-based ingredient names instead of structured relationships
  const foodName = ingredient.food_name || "Unknown ingredient";
  const unitName = ingredient.unit_name || "";

  return (
    <TooltipProvider>
      <div 
        className={`flex items-center p-4 rounded-md border-2 transition-colors ${styles.container} cursor-pointer h-full min-h-[56px]`}
        onClick={handleIngredientClick}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className={`flex items-baseline gap-x-1.5 text-base ${styles.text}`}>
            <span className="font-medium whitespace-nowrap">
              {scaledAmount || ingredient.amount} {unitName}
            </span>
            <span className="truncate">{foodName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 action-buttons shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectIngredient(ingredient, "increase")}
                className={`p-1 rounded-full ${
                  selectedAction === "increase" 
                    ? "bg-green-500 text-white" 
                    : "hover:bg-green-100 text-green-600 hover:text-green-700"
                }`}
                aria-label="Increase ingredient"
              >
                <Plus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Increase amount</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectIngredient(ingredient, "decrease")}
                className={`p-1 rounded-full ${
                  selectedAction === "decrease" 
                    ? "bg-amber-500 text-white" 
                    : "hover:bg-amber-100 text-amber-600 hover:text-amber-700"
                }`}
                aria-label="Decrease ingredient"
              >
                <Minus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Decrease amount</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectIngredient(ingredient, "remove")}
                className={`p-1 rounded-full ${
                  selectedAction === "remove" 
                    ? "bg-red-500 text-white" 
                    : "hover:bg-red-100 text-red-600 hover:text-red-700"
                }`}
                aria-label="Remove ingredient"
              >
                <X className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove or replace ingredient</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default IngredientItem;
