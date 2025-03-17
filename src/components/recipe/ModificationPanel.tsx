
import React from "react";
import { Recipe } from "@/types";
import ModificationPanelContainer from "./modification/ModificationPanelContainer";

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
  closePanel,
  isMobile = false,
  isSaving = false,
  isTemporary = false,
}) => {
  return (
    <ModificationPanelContainer
      recipe={recipe}
      closePanel={closePanel}
      isMobile={isMobile}
      isSaving={isSaving}
      isTemporary={isTemporary}
    />
  );
};

export default ModificationPanel;
