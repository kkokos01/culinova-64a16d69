
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import UnifiedModificationPanel from "./UnifiedModificationPanel";
import { Recipe, Ingredient } from "@/types";
import { useRecipe } from "@/context/recipe";
import { Card, CardHeader } from "@/components/ui/card";

interface ModificationPanelProps {
  recipe: Recipe | null;
  isModified: boolean;
  resetToOriginal: () => void;
  onAcceptModification: () => void;
  onStartModification: () => void;
  closePanel: () => void;
  isMobile?: boolean;
}

const ModificationPanel: React.FC<ModificationPanelProps> = ({
  recipe,
  isModified,
  resetToOriginal,
  onAcceptModification,
  onStartModification,
  closePanel,
  isMobile = false
}) => {
  const {
    selectedIngredients,
    customInstructions,
    removeIngredientSelection,
    setCustomInstructions
  } = useRecipe();

  return (
    <div className={`h-full flex flex-col overflow-hidden ${isMobile ? "bg-sage-400" : ""}`}>
      <Card className="bg-white rounded-none border-x-0 border-t-0 border-b border-white/20 shadow-none">
        <CardHeader className="p-3 flex flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={closePanel}
            className="text-sage-700 hover:text-sage-700 hover:bg-sage-100"
          >
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-sage-700">Modify Recipe</h2>
          <div className="w-8"></div>
        </CardHeader>
      </Card>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-black mb-6">Customize this recipe with AI assistance</p>
        
        <UnifiedModificationPanel
          recipe={recipe}
          selectedIngredients={selectedIngredients}
          onRemoveIngredientSelection={removeIngredientSelection}
          customInstructions={customInstructions}
          onCustomInstructionsChange={setCustomInstructions}
          onStartModification={onStartModification}
        />
        
        {isModified && (
          <div className="mt-6 flex flex-col gap-2">
            <Button 
              variant="outline"
              onClick={resetToOriginal}
              className="w-full border-white/30 text-white hover:bg-sage-500 hover:text-white"
            >
              Reset to Original
            </Button>
            <Button 
              onClick={onAcceptModification}
              className="w-full bg-white text-sage-700 hover:bg-white/90 font-medium"
            >
              Save as New Version
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModificationPanel;
