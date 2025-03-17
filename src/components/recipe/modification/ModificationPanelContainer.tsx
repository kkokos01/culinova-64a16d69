
import React from "react";
import { Recipe } from "@/types";
import { Loader2 } from "lucide-react";
import ModificationPanelHeader from "./ModificationPanelHeader";
import ModificationPanelContent from "./ModificationPanelContent";
import ModificationPanelFooter from "./ModificationPanelFooter";

interface ModificationPanelContainerProps {
  recipe: Recipe | null;
  closePanel: () => void;
  isMobile?: boolean;
  isSaving?: boolean;
  isModified?: boolean;
  resetToOriginal?: () => void;
  onAcceptModification?: () => void;
  onSelectModificationType: (type: string) => void;
  onApplyModifications: () => void;
  isTemporary?: boolean;
  isAiModifying?: boolean;
  selectedIngredients?: Map<string, any>;
  removeIngredientSelection?: (id: string) => void;
  selectedModifications: string[];
}

const ModificationPanelContainer: React.FC<ModificationPanelContainerProps> = ({
  recipe,
  closePanel,
  isMobile = false,
  isSaving = false,
  isModified = false,
  resetToOriginal,
  onAcceptModification,
  onSelectModificationType,
  onApplyModifications,
  isAiModifying = false,
  selectedIngredients,
  removeIngredientSelection,
  selectedModifications
}) => {
  // Custom instructions state - can stay here as it's not part of the selection/application flow
  const [customInstructions, setCustomInstructions] = React.useState("");

  // Determine if modification can be started
  const hasSelectedIngredients = selectedIngredients?.size > 0;
  const hasCustomInstructions = customInstructions.trim().length > 0;
  const hasSelectedModifications = selectedModifications.length > 0;
  const canModify = hasSelectedIngredients || hasCustomInstructions || hasSelectedModifications;

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
        selectedIngredients={selectedIngredients || new Map()}
        onRemoveIngredientSelection={removeIngredientSelection || (() => {})}
        customInstructions={customInstructions}
        onCustomInstructionsChange={setCustomInstructions}
        onSelectModificationType={onSelectModificationType}
        isDisabled={isAiModifying}
        selectedModifications={selectedModifications}
      />

      <div className="p-4 border-t border-white/20">
        <ModificationPanelFooter
          isModified={isModified || false}
          onReset={resetToOriginal || (() => {})}
          onSave={onAcceptModification || (() => {})}
          onApplyModifications={onApplyModifications}
          isSaving={isSaving}
          isAiModifying={isAiModifying}
          canModify={canModify}
        />
      </div>
    </div>
  );
};

export default ModificationPanelContainer;
