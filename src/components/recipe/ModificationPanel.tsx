
import React from "react";
import { Recipe } from "@/types";
import ModificationPanelContainer from "./modification/ModificationPanelContainer";

interface ModificationPanelProps {
  recipe: Recipe | null;
  closePanel: () => void;
  isMobile?: boolean;
  isSaving?: boolean;
}

const ModificationPanel: React.FC<ModificationPanelProps> = ({
  recipe,
  closePanel,
  isMobile = false,
  isSaving = false,
}) => {
  return (
    <ModificationPanelContainer
      recipe={recipe}
      closePanel={closePanel}
      isMobile={isMobile}
      isSaving={isSaving}
    />
  );
};

export default ModificationPanel;
