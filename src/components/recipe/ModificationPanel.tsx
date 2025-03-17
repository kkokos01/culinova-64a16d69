
import React from "react";
import { Recipe } from "@/types";
import { X, ArrowLeft, RotateCcw, Save, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SelectedIngredientsPanel from "./SelectedIngredientsPanel";
import { useRecipe } from "@/context/recipe";

interface ModificationPanelProps {
  recipe: Recipe | null;
  isModified: boolean;
  resetToOriginal: () => void;
  onAcceptModification: () => void;
  onStartModification: () => void;
  closePanel: () => void;
  isMobile?: boolean;
  isSaving?: boolean;
  isTemporary?: boolean;
  isAiModifying?: boolean;
}

const ModificationPanel: React.FC<ModificationPanelProps> = ({
  recipe,
  isModified,
  resetToOriginal,
  onAcceptModification,
  onStartModification,
  closePanel,
  isMobile = false,
  isSaving = false,
  isTemporary = false,
  isAiModifying = false
}) => {
  const { selectedIngredients, customInstructions, setCustomInstructions, removeIngredientSelection } = useRecipe();

  const hasSelectedIngredients = selectedIngredients.size > 0;
  const hasCustomInstructions = customInstructions.trim().length > 0;
  const canModify = hasSelectedIngredients || hasCustomInstructions;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={closePanel}
              className="mr-2 text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={closePanel}
              className="mr-2 text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          <h2 className="text-xl font-bold text-white">
            Modify Recipe
            {isTemporary && (
              <Badge variant="outline" className="ml-2 px-2 py-1 bg-white/20 text-white border-white/30 flex items-center">
                <Database className="h-3 w-3 mr-1" />
                Temporary
              </Badge>
            )}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-2">Selected Ingredients</h3>
          <SelectedIngredientsPanel
            selectedIngredients={selectedIngredients}
            onRemoveIngredient={removeIngredientSelection}
          />
        </div>

        <Separator className="bg-white/20 my-6" />

        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-2">Custom Instructions</h3>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            className="w-full h-32 px-3 py-2 rounded border border-white/30 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            placeholder="Add custom instructions for modifying this recipe..."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        {isModified ? (
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={resetToOriginal}
              className="text-white border-white/30 hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Original
            </Button>
            <Button
              onClick={onAcceptModification}
              disabled={isSaving || isAiModifying}
              className="bg-white text-sage-600 hover:bg-white/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isTemporary ? "Save to Database" : "Save as New Version"}
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={onStartModification}
            disabled={!canModify || isAiModifying}
            className="w-full bg-white text-sage-600 hover:bg-white/90"
          >
            {isAiModifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Modifying Recipe...
              </>
            ) : (
              "Modify Recipe with AI"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModificationPanel;
