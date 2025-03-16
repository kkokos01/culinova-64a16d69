
import React, { useState, useEffect } from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import AIModificationPanel from "./AIModificationPanel";
import RecipeVersionTabs from "./RecipeVersionTabs";
import { useRecipe } from "@/context/RecipeContext";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DesktopLayoutProps {
  recipe: Recipe | null;
  selectedIngredient: Ingredient | null;
  isModified: boolean;
  resetToOriginal: () => void;
  handleModifyWithAI: () => void;
  handleStartModification: (modificationType: string) => void;
  handleAcceptChanges: () => void;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
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
}) => {
  const { 
    originalRecipe, 
    selectedIngredients, 
    customInstructions,
    recipeVersions,
    selectIngredientForModification, 
    removeIngredientSelection,
    setCustomInstructions,
    addRecipeVersion
  } = useRecipe();
  
  // State for panel visibility
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  // Effect to initialize the original recipe version when it's first loaded
  useEffect(() => {
    if (originalRecipe && recipeVersions.length === 0) {
      addRecipeVersion("Original", originalRecipe);
    }
  }, [originalRecipe, recipeVersions.length, addRecipeVersion]);

  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove") => {
    setSelectedIngredient(ingredient);
    selectIngredientForModification(ingredient, action);
  };

  // Handle AI modification acceptance
  const handleAcceptModification = () => {
    if (recipe) {
      // Create a new version
      addRecipeVersion("Modified", recipe);
      handleAcceptChanges();
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {recipe && (
        <>
          <RecipeHeader
            recipe={recipe}
            isModified={isModified}
            onModifyWithAI={handleModifyWithAI}
          />

          <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
            {/* Left Panel - AI Modification */}
            <ResizablePanel 
              defaultSize={20} 
              minSize={leftPanelCollapsed ? 4 : 15} 
              maxSize={leftPanelCollapsed ? 4 : 30}
              collapsible
              collapsedSize={4}
              onCollapse={() => setLeftPanelCollapsed(true)}
              onExpand={() => setLeftPanelCollapsed(false)}
              className="bg-white p-4 relative"
            >
              {leftPanelCollapsed ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setLeftPanelCollapsed(false)}
                    className="absolute top-4 right-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="rotate-90 whitespace-nowrap text-sm font-medium text-gray-500">
                    Recipe Modification
                  </div>
                </div>
              ) : (
                <div className="overflow-y-auto h-full">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setLeftPanelCollapsed(true)}
                    className="absolute top-4 right-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <AIModificationPanel
                    recipe={recipe}
                    isOpen={true}
                    onClose={() => {}}
                    onStartModification={handleStartModification}
                    selectedIngredients={selectedIngredients}
                    onRemoveIngredientSelection={removeIngredientSelection}
                    customInstructions={customInstructions}
                    onCustomInstructionsChange={setCustomInstructions}
                  />
                  
                  {isModified && (
                    <div className="mt-6 flex flex-col gap-2">
                      <Button 
                        variant="outline"
                        onClick={resetToOriginal}
                        className="w-full"
                      >
                        Reset to Original
                      </Button>
                      <Button 
                        onClick={handleAcceptModification}
                        className="w-full"
                      >
                        Save as New Version
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Main Content - Recipe with Tabs */}
            <ResizablePanel defaultSize={80} className="bg-white p-4 overflow-y-auto">
              <RecipeVersionTabs />
              <RecipeContent 
                recipe={recipe} 
                selectedIngredients={selectedIngredients}
                onSelectIngredient={handleSelectIngredient} 
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </>
      )}
    </div>
  );
};

export default DesktopLayout;
