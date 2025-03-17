
import React from "react";
import { Recipe, Ingredient } from "@/types";
import ModificationPanelContainer from "./modification/ModificationPanelContainer";

interface ModificationPanelProps {
  recipe: Recipe | null;
  closePanel: () => void;
  isMobile?: boolean;
  isSaving?: boolean;
  isModified?: boolean;
  resetToOriginal?: () => void;
  onAcceptModification?: () => void;
  onStartModification?: (instructions: string) => void;
  isTemporary?: boolean;
  isAiModifying?: boolean;
  selectedIngredients?: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  removeIngredientSelection?: (id: string) => void;
  selectedModifications?: string[];
  onSelectModificationType?: (type: string) => void;
}

const ModificationPanel: React.FC<ModificationPanelProps> = ({
  recipe,
  closePanel,
  isMobile = false,
  isSaving = false,
  isModified = false,
  resetToOriginal,
  onAcceptModification,
  onStartModification,
  isTemporary = false,
  isAiModifying = false,
  selectedIngredients,
  removeIngredientSelection,
  selectedModifications = [],
  onSelectModificationType
}) => {
  return (
    <ModificationPanelContainer
      recipe={recipe}
      closePanel={closePanel}
      isMobile={isMobile}
      isSaving={isSaving}
      isModified={isModified}
      resetToOriginal={resetToOriginal}
      onAcceptModification={onAcceptModification}
      onStartModification={onStartModification}
      isTemporary={isTemporary}
      isAiModifying={isAiModifying}
      selectedIngredients={selectedIngredients}
      removeIngredientSelection={removeIngredientSelection}
      selectedModifications={selectedModifications}
      onSelectModificationType={onSelectModificationType}
    />
  );
};

export default ModificationPanel;
