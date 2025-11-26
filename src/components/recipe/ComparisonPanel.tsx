
import React from "react";
import { Button } from "@/components/ui/button";
import { Ingredient, Recipe } from "@/types";
import { Info, Check, X, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComparisonPanelProps {
  recipe: Recipe | null;
  originalRecipe: Recipe | null;
  selectedIngredient: Ingredient | null;
  isModified: boolean;
  onResetToOriginal: () => void;
  onAcceptChanges: () => void;
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  recipe,
  originalRecipe,
  selectedIngredient,
  isModified,
  onResetToOriginal,
  onAcceptChanges,
}) => {
  if (!recipe) return null;

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Recipe Details</h2>

      {isModified && (
        <div className="mb-6 border border-amber-200 bg-amber-50 rounded-md p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
            <h3 className="font-semibold text-amber-700 text-sm sm:text-base">AI Modified Recipe</h3>
          </div>
          <p className="text-xs sm:text-sm text-amber-700 mb-3">
            This recipe has been modified by AI. Review the changes below.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onResetToOriginal}
              className="border-amber-300 text-amber-700 hover:bg-amber-100 text-xs h-8 px-2 sm:px-3"
            >
              <RotateCcw className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={onAcceptChanges}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8 px-2 sm:px-3"
            >
              <Check className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              Accept Changes
            </Button>
          </div>
        </div>
      )}

      {selectedIngredient ? (
        <div className="p-3 sm:p-4 border border-gray-200 rounded-md bg-white">
          <h3 className="font-medium mb-2 text-sm sm:text-base">
            {selectedIngredient.food_name || "Unknown ingredient"}
            {isModified && (
              <Badge className="ml-2 bg-amber-500 text-xs">Modified</Badge>
            )}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">
            Ingredient details
          </p>
          <div className="flex items-center text-xs sm:text-sm text-gray-700">
            <span className="font-medium">Amount:</span>
            <span className="ml-2">
              {selectedIngredient.amount} {selectedIngredient.unit_name || ""}
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              Food ID: {selectedIngredient.food_id}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-primary border-primary/30 hover:bg-primary/5 text-xs"
            >
              Send to LLM (Coming Soon)
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3 sm:p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
          <p className="text-gray-500 text-xs sm:text-sm text-center">
            Select an ingredient to view details
          </p>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Comparison View</h2>
        {isModified ? (
          <div className="space-y-4">
            <div className="bg-white border rounded-md p-3 sm:p-4">
              <h3 className="font-medium mb-2 flex items-center text-sm sm:text-base">
                <span>Changes Overview</span>
              </h3>
              <ul className="text-xs sm:text-sm space-y-2">
                <li className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2 flex-shrink-0"></div>
                  <span>Added ingredients: 0</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 flex-shrink-0"></div>
                  <span>Removed ingredients: 0</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 flex-shrink-0"></div>
                  <span>Modified ingredients: 0</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
                  <span>Modified steps: 0</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-3 sm:p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
            <div className="flex items-center justify-center h-24 sm:h-32 text-gray-500">
              <div className="text-center">
                <Info className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                <p className="text-xs sm:text-sm">Modify the recipe to see comparisons</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonPanel;
