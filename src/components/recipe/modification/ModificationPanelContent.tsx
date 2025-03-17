
import React from "react";
import { Ingredient } from "@/types";
import { Separator } from "@/components/ui/separator";
import IngredientSelectionSection from "./IngredientSelectionSection";
import CustomInstructionsSection from "./CustomInstructionsSection";
import QuickModificationsSection from "./QuickModificationsSection";

interface ModificationPanelContentProps {
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onRemoveIngredientSelection: (id: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (instructions: string) => void;
  onSelectModificationType: (type: string) => void;
  isDisabled?: boolean;
  selectedModifications: string[];
}

const ModificationPanelContent: React.FC<ModificationPanelContentProps> = ({
  selectedIngredients,
  onRemoveIngredientSelection,
  customInstructions,
  onCustomInstructionsChange,
  onSelectModificationType,
  isDisabled = false,
  selectedModifications
}) => {
  return (
    <div className="flex-grow overflow-y-auto p-4">
      <IngredientSelectionSection
        selectedIngredients={selectedIngredients}
        onRemoveSelection={onRemoveIngredientSelection}
      />

      <Separator className="bg-white/20 my-6" />

      <CustomInstructionsSection
        value={customInstructions}
        onChange={onCustomInstructionsChange}
        disabled={isDisabled}
      />

      <Separator className="bg-white/20 my-6" />

      <QuickModificationsSection
        onSelectModificationType={onSelectModificationType}
        disabled={isDisabled}
        selectedModifications={selectedModifications}
      />
    </div>
  );
};

export default ModificationPanelContent;
