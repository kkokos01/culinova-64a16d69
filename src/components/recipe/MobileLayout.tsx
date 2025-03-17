
import React, { useState } from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import { Drawer } from "@/components/ui/drawer";
import ModificationPanel from "./ModificationPanel";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

// Use props from RecipeDetailContainer
import { MobileLayoutProps } from "./RecipeDetailContainer";

const MobileLayout: React.FC<MobileLayoutProps> = ({
  recipe,
  selectedIngredient,
  setSelectedIngredient,
  handleSelectIngredient,
  isModified,
  resetToOriginal,
  handleModifyWithAI,
  handleStartModification,
  handleAcceptChanges,
  isAiModifying,
  selectedIngredients,
  removeIngredientSelection
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedModifications, setSelectedModifications] = useState<string[]>([]);
  
  const openModificationPanel = () => {
    setIsDrawerOpen(true);
  };
  
  const closeModificationPanel = () => {
    setIsDrawerOpen(false);
  };
  
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await handleAcceptChanges();
    } catch (error) {
      console.error("Error saving changes:", error);
    } finally {
      setIsSaving(false);
      closeModificationPanel();
    }
  };

  // Function to handle selecting a modification type
  const handleSelectModificationType = (type: string) => {
    setSelectedModifications(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Function to start modification and close drawer
  const handleStartModificationWithSelectedTypes = () => {
    // Combine all selected modifications into a single instruction
    const instructions = selectedModifications.join(", ");
    if (instructions) {
      handleStartModification(instructions);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <RecipeHeader
        recipe={recipe}
        isModified={isModified}
        onModifyWithAI={handleModifyWithAI}
        showModifyButton={false}
      />
      
      {/* Main Recipe Content */}
      <div className="flex-grow overflow-y-auto">
        <RecipeContent
          recipe={recipe}
          selectedIngredients={selectedIngredients}
          onSelectIngredient={handleSelectIngredient}
        />
      </div>
      
      {/* AI Modification Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={openModificationPanel}
          className="w-full bg-sage-500 hover:bg-sage-600 text-white"
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Modify Recipe with AI
        </Button>
      </div>
      
      {/* Modification Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay />
          <Drawer.Content className="bg-sage-700 text-white">
            <div className="h-[85vh]">
              <ModificationPanel
                recipe={recipe}
                isModified={isModified}
                resetToOriginal={resetToOriginal}
                onAcceptModification={handleSaveChanges}
                onStartModification={handleStartModificationWithSelectedTypes}
                closePanel={closeModificationPanel}
                isMobile={true}
                isSaving={isSaving}
                isTemporary={true}
                isAiModifying={isAiModifying}
                selectedIngredients={selectedIngredients}
                removeIngredientSelection={removeIngredientSelection}
                selectedModifications={selectedModifications}
                onSelectModificationType={handleSelectModificationType}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer>
    </div>
  );
};

export default MobileLayout;
