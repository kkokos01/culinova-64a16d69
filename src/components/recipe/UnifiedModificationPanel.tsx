
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Recipe, Ingredient } from "@/types";
import { Check, Wand2 } from "lucide-react";
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
    <div className="h-full overflow-y-auto text-white">
      <div className="mb-6 p-3 bg-white/10 rounded-lg shadow-sm border border-white/20">
        <label htmlFor="custom-instructions" className="block text-sm font-medium text-white mb-2">
          Custom Instructions
        </label>
        <Textarea
          id="custom-instructions"
          placeholder="Example: Make this recipe keto-friendly and reduce the cooking time"
          value={customInstructions}
          onChange={(e) => onCustomInstructionsChange(e.target.value)}
          className="h-24 sm:h-28 text-sm bg-white/10 border-white/20 text-white placeholder-white/50 focus-visible:ring-white/30"
        />
      </div>
      
      {/* Common modification options */}
      <div className="mb-6 p-3 bg-white/10 rounded-lg shadow-sm border border-white/20">
        <label className="block text-sm font-medium text-white mb-2">
          Quick Modifications
        </label>
        <div className="flex flex-wrap gap-2">
          {MODIFICATION_OPTIONS.map((option) => (
            <Button
              key={option}
              variant="outline"
              size="sm"
              className={`rounded-full px-4 py-1 h-auto text-sm ${
                selectedModifications.includes(option)
                  ? "bg-white/20 border-white/40 text-white font-medium"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
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
      <div className="mb-6 p-3 bg-white/10 rounded-lg shadow-sm border border-white/20">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-white">
            Ingredient Modifications
          </label>
          {selectedIngredients.size > 0 && (
            <Badge variant="outline" className="text-xs px-2 bg-white/10 border-white/20 text-white">
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
          <div className="text-sm text-white/70 bg-white/5 border border-dashed border-white/20 rounded-md p-4 text-center">
            Select ingredients from the recipe to modify their quantities or remove them
          </div>
        )}
      </div>
      
      {/* Submit button with improved contrast */}
      <Button 
        className="w-full bg-white text-sage-700 hover:bg-white/90 font-medium shadow-md flex items-center justify-center gap-2"
        onClick={onStartModification}
        disabled={selectedIngredients.size === 0 && selectedModifications.length === 0 && !customInstructions.trim()}
      >
        <Wand2 className="h-4 w-4" />
        Generate Modified Recipe
      </Button>
    </div>
  );
};

export default UnifiedModificationPanel;
