
import React from "react";
import { Recipe, Ingredient } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, PlusCircle, MinusCircle, Trash, Wand2, Loader2 } from "lucide-react";

interface UnifiedModificationPanelProps {
  recipe: Recipe | null;
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onRemoveIngredientSelection: (id: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (instructions: string) => void;
  onApplyModifications: () => void; // Changed from onApplyModifications to be consistent
  onSelectModificationType: (type: string) => void;
  isDisabled?: boolean;
  selectedModifications: string[];
}

const UnifiedModificationPanel: React.FC<UnifiedModificationPanelProps> = ({
  recipe,
  selectedIngredients,
  onRemoveIngredientSelection,
  customInstructions,
  onCustomInstructionsChange,
  onApplyModifications, // Changed from onApplyModifications
  onSelectModificationType,
  isDisabled = false,
  selectedModifications = []
}) => {
  const hasSelectedIngredients = selectedIngredients.size > 0;
  const hasCustomInstructions = customInstructions.trim().length > 0;
  const hasSelectedModifications = selectedModifications.length > 0;
  const canModify = hasSelectedIngredients || hasCustomInstructions || hasSelectedModifications;

  const getActionColor = (action: string) => {
    switch (action) {
      case "increase":
        return "bg-green-100 text-green-800 border-green-200";
      case "decrease":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "remove":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "increase":
        return <PlusCircle className="h-4 w-4 text-green-600" />;
      case "decrease":
        return <MinusCircle className="h-4 w-4 text-amber-600" />;
      case "remove":
        return <Trash className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const modificationType = [
    { id: "healthier", label: "Healthier" },
    { id: "simpler", label: "Simpler" },
    { id: "vegan", label: "Vegan" },
    { id: "vegetarian", label: "Vegetarian" },
    { id: "pescatarian", label: "Pescatarian" },
    { id: "gluten-free", label: "Gluten-Free" },
    { id: "dairy-free", label: "Dairy-Free" },
    { id: "nut-free", label: "Nut-Free" },
    { id: "soy-free", label: "Soy-Free" },
    { id: "keto", label: "Keto" },
    { id: "low-carb", label: "Low-Carb" },
    { id: "high-protein", label: "High-Protein" },
    { id: "quicker", label: "Quicker" },
    { id: "spicier", label: "Spicier" },
    { id: "budget", label: "Budget" }
  ];

  const isSelected = (id: string) => {
    return selectedModifications.includes(id);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Selected Ingredients</h3>
          
          {hasSelectedIngredients ? (
            <ul className="space-y-2 mb-4">
              {Array.from(selectedIngredients.entries()).map(([id, { ingredient, action }]) => (
                <li key={id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                  <div className="flex items-center">
                    {getActionIcon(action)}
                    <span className="ml-2">{ingredient.food_name || "Unknown ingredient"}</span>
                    <Badge variant="outline" className={`ml-2 ${getActionColor(action)}`}>
                      {action}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveIngredientSelection(id)}
                    className="h-7 w-7 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm mb-4 italic">
              Select ingredients from the recipe to modify them
            </p>
          )}
          
          <Separator className="my-4" />
          
          <h3 className="text-lg font-medium text-gray-800 mb-3">Custom Instructions</h3>
          <textarea
            id="custom-instructions"
            name="customInstructions"
            value={customInstructions}
            onChange={(e) => onCustomInstructionsChange(e.target.value)}
            className="w-full h-24 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent"
            placeholder="Add custom instructions for modifying this recipe..."
            disabled={isDisabled}
          />
          
          <Separator className="my-4" />
          
          <h3 className="text-lg font-medium text-gray-800 mb-3">Quick Modifications</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {modificationType.map((type) => (
              <Button
                key={type.id}
                variant={isSelected(type.id) ? "default" : "outline"}
                onClick={() => onSelectModificationType(type.id)}
                disabled={isDisabled}
                className={isSelected(type.id) 
                  ? "bg-sage-500 text-white hover:bg-sage-600" 
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"}
              >
                {type.label}
              </Button>
            ))}
          </div>
          
          <Button
            onClick={onApplyModifications} // Changed from onApplyModifications
            disabled={!canModify || isDisabled}
            className="w-full mt-4 bg-sage-500 hover:bg-sage-600 text-white font-medium py-2 rounded-md flex items-center justify-center"
          >
            {isDisabled ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI is Modifying Recipe...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Apply Modifications
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedModificationPanel;
