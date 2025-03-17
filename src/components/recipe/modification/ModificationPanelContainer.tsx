
import React from "react";
import { Recipe } from "@/types";
import { Loader2 } from "lucide-react";
import ModificationPanelHeader from "./ModificationPanelHeader";
import ModificationPanelContent from "./ModificationPanelContent";
import ModificationPanelFooter from "./ModificationPanelFooter";
import { useRecipeModification } from "@/hooks/recipe/useRecipeModification";

interface ModificationPanelContainerProps {
  recipe: Recipe | null;
  closePanel: () => void;
  isMobile?: boolean;
  isSaving?: boolean;
  isModified?: boolean;
  resetToOriginal?: () => void;
  onAcceptModification?: () => void;
  onStartModification?: () => void;
  isTemporary?: boolean;
  isAiModifying?: boolean;
}

const ModificationPanelContainer: React.FC<ModificationPanelContainerProps> = ({
  recipe,
  closePanel,
  isMobile = false,
  isSaving = false,
  isModified = false,
  resetToOriginal,
  onAcceptModification,
  onStartModification,
  isAiModifying = false
}) => {
  const {
    selectedIngredients,
    removeIngredientSelection,
    customInstructions,
    setCustomInstructions,
    handleStartModification,
    handleSaveChanges,
    selectIngredientForModification
  } = useRecipeModification(recipe, null);

  // Handle selecting a quick modification type
  const handleSelectModificationType = (type: string) => {
    // Set custom instructions based on the selected modification type
    setCustomInstructions(`Make this recipe ${type}`);
  };

  // Determine if modification can be started
  const hasSelectedIngredients = selectedIngredients.size > 0;
  const hasCustomInstructions = customInstructions.trim().length > 0;
  const canModify = hasSelectedIngredients || hasCustomInstructions;

  // If no recipe data is available, show loading state
  if (!recipe) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <p className="mt-2 text-white">Loading recipe data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ModificationPanelHeader 
        onClose={closePanel}
        isMobile={isMobile}
      />

      <ModificationPanelContent
        selectedIngredients={selectedIngredients}
        onRemoveIngredientSelection={removeIngredientSelection}
        customInstructions={customInstructions}
        onCustomInstructionsChange={setCustomInstructions}
        onSelectModificationType={handleSelectModificationType}
        isDisabled={isAiModifying}
      />

      <div className="p-4 border-t border-white/20">
        <ModificationPanelFooter
          isModified={isModified || false}
          onReset={resetToOriginal || (() => {})}
          onSave={onAcceptModification || handleSaveChanges}
          onStartModification={onStartModification || (() => handleStartModification(customInstructions))}
          isSaving={isSaving}
          isAiModifying={isAiModifying}
          canModify={canModify}
        />
      </div>
    </div>
  );
};

export default ModificationPanelContainer;
