
import React from "react";
import { Ingredient } from "@/types";
import { Separator } from "@/components/ui/separator";
import IngredientSelectionSection from "./IngredientSelectionSection";
import CustomInstructionsSection from "./CustomInstructionsSection";

interface ModificationPanelContentProps {
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onRemoveIngredientSelection: (id: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (instructions: string) => void;
  isDisabled?: boolean;
}

const ModificationPanelContent: React.FC<ModificationPanelContentProps> = ({
  selectedIngredients,
  onRemoveIngredientSelection,
  customInstructions,
  onCustomInstructionsChange,
  isDisabled = false
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
    </div>
  );
};

export default ModificationPanelContent;
