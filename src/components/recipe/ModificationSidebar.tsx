
import React from "react";
import { Recipe, Ingredient } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ChevronLeft, Wand2, Loader2 } from "lucide-react";
import UnifiedModificationPanel from "./UnifiedModificationPanel";
import AILoadingProgress from "@/components/ui/AILoadingProgress";

interface ModificationSidebarProps {
  recipe: Recipe;
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onRemoveIngredientSelection: (id: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (instructions: string) => void;
  onStartModification: () => void;
  onSelectModificationType: (type: string) => void;
  selectedQuickModifications?: string[];
  onApplyModifications: () => void;
  isModified: boolean;
  resetToOriginal: () => void;
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
  selectedQuickModifications = [],
  onApplyModifications,
  isModified,
  resetToOriginal,
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
          onApplyModifications={onApplyModifications}
          onSelectModificationType={onSelectModificationType}
          isDisabled={isDisabled}
          selectedModifications={selectedQuickModifications}
        />
        
        <AILoadingProgress
          isLoading={isDisabled}
          message="AI is modifying recipe..."
          className="mt-4"
        />
      </div>
    </div>
  );
};

export default ModificationSidebar;
