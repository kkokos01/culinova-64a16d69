
import React, { useState } from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import { 
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal
} from "@/components/ui/drawer";
import ModificationPanel from "./ModificationPanel";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import VersionManagement from "./VersionManagement";
import { useRecipe } from "@/context/recipe";

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
  
  // Get recipeVersions and activeVersionId from context to check if version is temporary
  const { recipeVersions, activeVersionId } = useRecipe();
  
  // Find the active version to check if it's temporary
  const activeVersion = recipeVersions.find(v => v.id === activeVersionId);
  const isActiveVersionTemporary = activeVersion?.isTemporary || false;
  
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

  // Function to handle selecting a modification type (only toggles selection)
  const handleSelectModificationType = (type: string) => {
    setSelectedModifications(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Separate function to apply the selected modifications
  const handleApplyModifications = () => {
    if (selectedModifications.length > 0) {
      const instructions = selectedModifications.join(", ");
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
      
      {/* Add VersionManagement component here to ensure version tabs are shown on mobile */}
      {recipe && (
        <div className="px-4">
          <VersionManagement 
            isActiveVersionTemporary={isActiveVersionTemporary}
            onSaveToDatabase={handleAcceptChanges}
          />
        </div>
      )}
      
      {/* Main Recipe Content */}
      <div className="flex-grow overflow-y-auto px-4">
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
        <DrawerPortal>
          <DrawerOverlay />
          <DrawerContent className="bg-sage-700 text-white">
            <div className="h-[85vh]">
              <ModificationPanel
                recipe={recipe}
                isModified={isModified}
                resetToOriginal={resetToOriginal}
                onAcceptModification={handleSaveChanges}
                onSelectModificationType={handleSelectModificationType}
                onApplyModifications={handleApplyModifications}
                closePanel={closeModificationPanel}
                isMobile={true}
                isSaving={isSaving}
                isTemporary={isActiveVersionTemporary}
                isAiModifying={isAiModifying}
                selectedIngredients={selectedIngredients}
                removeIngredientSelection={removeIngredientSelection}
                selectedModifications={selectedModifications}
              />
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </div>
  );
};

export default MobileLayout;
