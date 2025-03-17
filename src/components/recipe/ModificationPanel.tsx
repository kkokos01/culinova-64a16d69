
import React from "react";
import { Recipe } from "@/types";
import ModificationPanelContainer from "./modification/ModificationPanelContainer";

interface ModificationPanelProps {
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
  isAiModifying = false
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
    />
  );
};

export default ModificationPanel;
