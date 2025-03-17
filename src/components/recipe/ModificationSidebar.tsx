
import React from "react";
import { Recipe, Ingredient } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ChevronLeft, Wand2, Loader2 } from "lucide-react";
import UnifiedModificationPanel from "./UnifiedModificationPanel";

interface ModificationSidebarProps {
  recipe: Recipe;
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onRemoveIngredientSelection: (id: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (instructions: string) => void;
  onStartModification: () => void;
  onSelectModificationType: (type: string) => void;
  isModified: boolean;
  resetToOriginal: () => void;
  onSaveChanges: () => Promise<void>;
  isDisabled?: boolean;
  isSaving?: boolean;
  isActiveVersionTemporary?: boolean;
  onTogglePanel: () => void;
  selectedModifications: string[];
}

const ModificationSidebar: React.FC<ModificationSidebarProps> = ({
  recipe,
  selectedIngredients,
  onRemoveIngredientSelection,
  customInstructions,
  onCustomInstructionsChange,
  onStartModification,
  onSelectModificationType,
  isModified,
  resetToOriginal,
  onSaveChanges,
  isDisabled = false,
  isSaving = false,
  isActiveVersionTemporary = false,
  onTogglePanel,
  selectedModifications = []
}) => {
  return (
    <div className="overflow-y-auto h-full">
      <Card className="rounded-none border-x-0 border-t-0 border-b border-white/20 shadow-none">
        <CardHeader className="p-3 flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold text-sage-600">Modify Recipe</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onTogglePanel}
            className="text-sage-600 hover:text-sage-600 hover:bg-sage-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>
      
      <div className="p-4">
        <p className="text-black mb-6">Customize this recipe with AI assistance</p>
        
        <UnifiedModificationPanel
          recipe={recipe}
          selectedIngredients={selectedIngredients}
          onRemoveIngredientSelection={onRemoveIngredientSelection}
          customInstructions={customInstructions}
          onCustomInstructionsChange={onCustomInstructionsChange}
          onApplyModifications={onStartModification}
          onSelectModificationType={onSelectModificationType}
          isDisabled={isDisabled}
          selectedModifications={selectedModifications}
        />
        
        {isDisabled && (
          <div className="mt-4 flex justify-center">
            <div className="flex items-center text-sage-800">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>AI is modifying recipe...</span>
            </div>
          </div>
        )}
        
        {isModified && (
          <div className="mt-6 flex flex-col gap-2">
            <Button 
              variant="outline"
              onClick={resetToOriginal}
              className="w-full border-white/30 text-white hover:bg-sage-600 hover:text-white"
            >
              Reset to Original
            </Button>
            
            <Button 
              onClick={onSaveChanges}
              disabled={isSaving}
              className="w-full bg-white text-sage-600 hover:bg-white/90 font-medium"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {isActiveVersionTemporary ? 'Save to Database' : 'Save as New Version'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModificationSidebar;
