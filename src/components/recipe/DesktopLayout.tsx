import React, { useState, useEffect } from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import { useRecipe } from "@/context/recipe";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChevronRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModificationSidebar from "./ModificationSidebar";
import VersionManagement from "./VersionManagement";
import { useToast } from "@/hooks/use-toast";

interface DesktopLayoutProps {
  recipe: Recipe | null;
  selectedIngredient: Ingredient | null;
  isModified: boolean;
  resetToOriginal: () => void;
  handleModifyWithAI: () => void;
  handleStartModification: (modificationType: string) => void;
  handleAcceptChanges: () => void;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
  onSelectIngredient: (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => void;
  isAiModifying?: boolean;
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  recipe,
  selectedIngredient,
  isModified,
  resetToOriginal,
  handleModifyWithAI,
  handleStartModification,
  handleAcceptChanges,
  setSelectedIngredient,
  onSelectIngredient,
  isAiModifying = false
}) => {
  const { 
    selectedIngredients, 
    customInstructions,
    recipeVersions,
    isLoadingVersions,
    selectIngredientForModification, 
    removeIngredientSelection,
    setCustomInstructions,
    addRecipeVersion,
    persistVersion,
    activeVersionId
  } = useRecipe();
  
  const { toast } = useToast();
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true);
  const [leftPanelSize, setLeftPanelSize] = useState(4);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedModifications, setSelectedModifications] = useState<string[]>([]);
  
  // Get the active version to check if it's temporary
  const activeVersion = recipeVersions.find(v => v.id === activeVersionId);
  const isActiveVersionTemporary = activeVersion?.isTemporary || false;
  
  useEffect(() => {
    setLeftPanelSize(leftPanelCollapsed ? 4 : 35);
  }, [leftPanelCollapsed]);

  const handleToggleModifyPanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed);
  };

  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    onSelectIngredient(ingredient, action);
  };

  const handleSaveToDatabase = async () => {
    if (!recipe) return;
    
    setIsSaving(true);
    try {
      if (isActiveVersionTemporary && activeVersionId) {
        await persistVersion(activeVersionId);
        toast({
          title: "Version Saved",
          description: "Recipe version has been saved to the database.",
        });
      } else {
        await handleAcceptChanges();
      }
    } catch (error) {
      console.error("Error saving to database:", error);
      toast({
        title: "Error Saving Version",
        description: error instanceof Error ? error.message : "Failed to save version",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle selecting a modification type
  const handleSelectModificationType = (type: string) => {
    // Toggle selection of the modification type
    setSelectedModifications(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    
    // Set custom instructions based on the selected type
    setCustomInstructions(`Make this recipe ${type}`);
  };
  
  // Handle applying selected modifications
  const handleApplyModifications = () => {
    try {
      if (selectedModifications.length > 0) {
        // Start the modification process with the selected types
        handleStartModification(selectedModifications.join(", "));
      } else if (customInstructions.trim()) {
        // Use custom instructions if no modifications are selected
        handleStartModification("custom");
      }
    } catch (error) {
      console.error("Error applying modifications:", error);
      toast({
        title: "Error",
        description: "Failed to apply modifications",
        variant: "destructive"
      });
    }
  };

  // Guard against null recipe
  if (!recipe) return null;

  return (
    <div className="container mx-auto py-2 px-3">
      <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-100px)] rounded-lg border">
        <ResizablePanel 
          defaultSize={4}
          size={leftPanelSize}
          minSize={leftPanelCollapsed ? 4 : 25} 
          maxSize={leftPanelCollapsed ? 4 : 40}
          collapsible
          collapsedSize={4}
          onCollapse={() => {
            setLeftPanelCollapsed(true);
          }}
          onExpand={() => {
            setLeftPanelCollapsed(false);
          }}
          className={`relative transition-all duration-300 ${
            leftPanelCollapsed 
              ? "bg-sage-500 text-white" 
              : "bg-sage-500 text-white shadow-lg"
          }`}
        >
          {leftPanelCollapsed ? (
            <div 
              className="h-full flex flex-col items-center justify-center cursor-pointer hover:bg-sage-600/60 transition-colors"
              onClick={handleToggleModifyPanel}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-2 text-white hover:text-white hover:bg-sage-600/60 pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="rotate-90 whitespace-nowrap text-base font-medium text-white flex items-center space-x-2">
                <Wand2 className="h-4 w-4 transform -rotate-90 mr-2" />
                <span>Recipe Modification</span>
              </div>
            </div>
          ) : (
            <ModificationSidebar 
              recipe={recipe}
              selectedIngredients={selectedIngredients}
              onRemoveIngredientSelection={removeIngredientSelection}
              customInstructions={customInstructions}
              onCustomInstructionsChange={setCustomInstructions}
              onStartModification={() => handleStartModification("custom")}
              onSelectModificationType={handleSelectModificationType}
              onApplyModifications={handleApplyModifications}
              isModified={isModified}
              resetToOriginal={resetToOriginal}
              onSaveChanges={handleSaveToDatabase}
              isDisabled={isAiModifying}
              isSaving={isSaving}
              isActiveVersionTemporary={isActiveVersionTemporary}
              onTogglePanel={handleToggleModifyPanel}
              selectedModifications={selectedModifications}
            />
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={65} className="bg-white overflow-y-auto">
          <div className="p-4">
            <RecipeHeader
              recipe={recipe}
              isModified={isModified}
              onModifyWithAI={handleToggleModifyPanel}
              showModifyButton={leftPanelCollapsed}
              isTemporary={isActiveVersionTemporary}
            />

            <VersionManagement 
              isActiveVersionTemporary={isActiveVersionTemporary}
              onSaveToDatabase={handleSaveToDatabase}
            />
            
            <RecipeContent 
              recipe={recipe} 
              selectedIngredients={selectedIngredients}
              onSelectIngredient={onSelectIngredient} 
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default DesktopLayout;
