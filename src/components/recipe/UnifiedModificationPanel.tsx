
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Recipe, Ingredient } from "@/types";
import { Check } from "lucide-react";
import SelectedIngredientsPanel from "./SelectedIngredientsPanel";

// List of common recipe modifications
const MODIFICATION_OPTIONS = [
  "Healthier",
  "Simpler",
  "Vegan",
  "Quicker",
  "Gluten-Free",
  "Keto",
  "Spicier",
  "Budget"
];

interface UnifiedModificationPanelProps {
  recipe: Recipe | null;
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onRemoveIngredientSelection: (id: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (instructions: string) => void;
  onStartModification: () => void;
}

const UnifiedModificationPanel: React.FC<UnifiedModificationPanelProps> = ({
  recipe,
  selectedIngredients,
  onRemoveIngredientSelection,
  customInstructions,
  onCustomInstructionsChange,
  onStartModification
}) => {
  // Track which modification options are selected
  const [selectedModifications, setSelectedModifications] = React.useState<string[]>([]);

  // Toggle a modification option
  const toggleModification = (option: string) => {
    setSelectedModifications(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Modify Recipe</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-4">
        Customize this recipe with AI assistance
      </p>
      
      {/* Custom instructions input */}
      <div className="mb-6">
        <label htmlFor="custom-instructions" className="block text-sm font-medium text-gray-700 mb-2">
          Custom Instructions
        </label>
        <Textarea
          id="custom-instructions"
          placeholder="Example: Make this recipe keto-friendly and reduce the cooking time"
          value={customInstructions}
          onChange={(e) => onCustomInstructionsChange(e.target.value)}
          className="h-24 sm:h-28 text-sm"
        />
      </div>
      
      {/* Common modification options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Modifications
        </label>
        <div className="flex flex-wrap gap-2">
          {MODIFICATION_OPTIONS.map((option) => (
            <Button
              key={option}
              variant="outline"
              size="sm"
              className={`rounded-full px-4 py-1 h-auto text-sm border ${
                selectedModifications.includes(option)
                  ? "bg-primary/10 border-primary text-primary font-medium"
                  : "bg-white"
              }`}
              onClick={() => toggleModification(option)}
            >
              {selectedModifications.includes(option) && (
                <Check className="mr-1 h-3.5 w-3.5" />
              )}
              {option}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Selected ingredients display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Ingredient Modifications
          </label>
          {selectedIngredients.size > 0 && (
            <Badge variant="outline" className="text-xs px-2 bg-gray-100">
              {selectedIngredients.size} selected
            </Badge>
          )}
        </div>
        
        {selectedIngredients.size > 0 ? (
          <SelectedIngredientsPanel
            selectedIngredients={selectedIngredients}
            onRemoveSelection={onRemoveIngredientSelection}
          />
        ) : (
          <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-md p-4 text-center">
            Select ingredients from the recipe to modify their quantities or remove them
          </div>
        )}
      </div>
      
      {/* Submit button */}
      <Button 
        className="w-full"
        onClick={onStartModification}
        disabled={selectedIngredients.size === 0 && selectedModifications.length === 0 && !customInstructions.trim()}
      >
        Generate Modified Recipe
      </Button>
    </div>
  );
};

export default UnifiedModificationPanel;
