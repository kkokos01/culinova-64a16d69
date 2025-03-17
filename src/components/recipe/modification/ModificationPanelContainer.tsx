
import React, { useState } from "react";
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
  onStartModification?: (instructions: string) => void;
  isTemporary?: boolean;
  isAiModifying?: boolean;
  selectedIngredients?: Map<string, any>;
  removeIngredientSelection?: (id: string) => void;
  selectedModifications?: string[];
  onSelectModificationType?: (type: string) => void;
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
  isAiModifying = false,
  selectedIngredients: externalSelectedIngredients,
  removeIngredientSelection: externalRemoveIngredientSelection,
  selectedModifications = [],
  onSelectModificationType
}) => {
  const {
    selectedIngredients: internalSelectedIngredients,
    removeIngredientSelection: internalRemoveIngredientSelection,
    customInstructions,
    setCustomInstructions,
    handleStartModification,
    handleSaveChanges,
    selectIngredientForModification
  } = useRecipeModification(recipe, null);

  // Use either external or internal state based on what's provided
  const selectedIngredients = externalSelectedIngredients || internalSelectedIngredients;
  const removeIngredientSelection = externalRemoveIngredientSelection || internalRemoveIngredientSelection;

  // Track selected quick modifications
  const [internalSelectedModifications, setInternalSelectedModifications] = useState<string[]>([]);

  // Handle selecting a quick modification type (just toggles selection)
  const handleSelectModificationType = (type: string) => {
    if (onSelectModificationType) {
      onSelectModificationType(type);
    } else {
      setInternalSelectedModifications(prev => {
        // If already selected, remove it; otherwise, add it
        if (prev.includes(type)) {
          return prev.filter(item => item !== type);
        } else {
          return [...prev, type];
        }
      });
    }
  };

  // Use either external or internal selected modifications
  const effectiveSelectedModifications = onSelectModificationType ? selectedModifications : internalSelectedModifications;

  // Create modification instructions with selected types and custom instructions
  const createModificationInstructions = () => {
    let instructions = customInstructions;
    
    if (effectiveSelectedModifications.length > 0) {
      // Add selected modifications at the beginning of instructions
      const modificationText = `Make this recipe ${effectiveSelectedModifications.join(', ')}`;
      
      if (instructions.trim()) {
        instructions = `${modificationText}. ${instructions}`;
      } else {
        instructions = modificationText;
      }
    }
    
    return instructions;
  };

  // Determine if modification can be started
  const hasSelectedIngredients = selectedIngredients.size > 0;
  const hasCustomInstructions = customInstructions.trim().length > 0;
  const hasSelectedModifications = effectiveSelectedModifications.length > 0;
  const canModify = hasSelectedIngredients || hasCustomInstructions || hasSelectedModifications;

  // Handle starting the modification
  const handleStartModificationWithOptions = () => {
    const instructions = createModificationInstructions();
    if (onStartModification) {
      onStartModification(instructions);
    } else {
      handleStartModification(instructions);
    }
  };

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
        selectedModifications={effectiveSelectedModifications}
      />

      <div className="p-4 border-t border-white/20">
        <ModificationPanelFooter
          isModified={isModified || false}
          onReset={resetToOriginal || (() => {})}
          onSave={onAcceptModification || handleSaveChanges}
          onStartModification={handleStartModificationWithOptions}
          isSaving={isSaving}
          isAiModifying={isAiModifying}
          canModify={canModify}
        />
      </div>
    </div>
  );
};

export default ModificationPanelContainer;
