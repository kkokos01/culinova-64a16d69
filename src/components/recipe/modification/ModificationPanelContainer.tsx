
import React, { useState } from "react";
import { Recipe } from "@/types";
import { Loader2 } from "lucide-react";
import ModificationPanelHeader from "./ModificationPanelHeader";
import ModificationPanelContent from "./ModificationPanelContent";
import ModificationPanelFooter from "./ModificationPanelFooter";
import { useModificationPanel } from "@/hooks/recipe/useModificationPanel";

interface ModificationPanelContainerProps {
  recipe: Recipe | null;
  closePanel: () => void;
  isMobile?: boolean;
  isSaving?: boolean;
  isTemporary?: boolean;
}

const ModificationPanelContainer: React.FC<ModificationPanelContainerProps> = ({
  recipe,
  closePanel,
  isMobile = false,
  isSaving = false,
  isTemporary = false
}) => {
  const {
    isModified,
    resetToOriginal,
    selectedIngredients,
    removeIngredientSelection,
    customInstructions,
    setCustomInstructions,
    isAiModifying,
    startModification,
    handleSaveChanges,
    isActiveVersionTemporary
  } = useModificationPanel();

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
        isTemporary={isTemporary || isActiveVersionTemporary}
      />

      <ModificationPanelContent
        selectedIngredients={selectedIngredients}
        onRemoveIngredientSelection={removeIngredientSelection}
        customInstructions={customInstructions}
        onCustomInstructionsChange={setCustomInstructions}
        isDisabled={isAiModifying}
      />

      <div className="p-4 border-t border-white/20">
        <ModificationPanelFooter
          isModified={isModified}
          onReset={resetToOriginal}
          onSave={handleSaveChanges}
          onStartModification={startModification}
          isSaving={isSaving}
          isAiModifying={isAiModifying}
          canModify={canModify}
          isTemporary={isTemporary || isActiveVersionTemporary}
        />
      </div>
    </div>
  );
};

export default ModificationPanelContainer;
