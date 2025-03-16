
import React, { useState, useEffect } from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import UnifiedModificationPanel from "./UnifiedModificationPanel";
import RecipeVersionTabs from "./RecipeVersionTabs";
import { useRecipe } from "@/context/recipe";
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
  onSelectIngredient: (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => void;
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
}) => {
  const { 
    selectedIngredients, 
    customInstructions,
    recipeVersions,
    selectIngredientForModification, 
    removeIngredientSelection,
    setCustomInstructions,
    addRecipeVersion
  } = useRecipe();
  
  // State for panel visibility
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true);
  // State for panel size
  const [leftPanelSize, setLeftPanelSize] = useState(4);
  
  // This useEffect is critical - it ensures the panel size updates when collapsed state changes
  useEffect(() => {
    // Set the size based on the collapsed state
    setLeftPanelSize(leftPanelCollapsed ? 4 : 35);
  }, [leftPanelCollapsed]);

  // Toggle the panel when Modify with AI is clicked
  const handleToggleModifyPanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed);
  };

  // Update this function to use the onSelectIngredient prop directly
  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    onSelectIngredient(ingredient, action);
  };

  // Handle AI modification acceptance
  const handleAcceptModification = () => {
    if (recipe) {
      // Create a new version
      addRecipeVersion("Modified", recipe);
      handleAcceptChanges();
    }
  };

  // Start modification with our unified approach
  const startUnifiedModification = () => {
    handleStartModification("unified");
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {recipe && (
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-130px)] rounded-lg border">
          {/* Left Panel - AI Modification */}
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
            className="bg-white p-4 relative transition-all duration-300"
          >
            {leftPanelCollapsed ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleToggleModifyPanel}
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Modify Recipe</h2>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleToggleModifyPanel}
                    className="self-start"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-gray-600 mb-6">Customize this recipe with AI assistance</p>
                
                <UnifiedModificationPanel
                  recipe={recipe}
                  selectedIngredients={selectedIngredients}
                  onRemoveIngredientSelection={removeIngredientSelection}
                  customInstructions={customInstructions}
                  onCustomInstructionsChange={setCustomInstructions}
                  onStartModification={startUnifiedModification}
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
          <ResizablePanel defaultSize={65} className="bg-white overflow-y-auto">
            <div className="p-6">
              <RecipeHeader
                recipe={recipe}
                isModified={isModified}
                onModifyWithAI={handleToggleModifyPanel}
                showModifyButton={leftPanelCollapsed} // Only show the button when the panel is collapsed
              />

              <RecipeVersionTabs />
              
              <RecipeContent 
                recipe={recipe} 
                selectedIngredients={selectedIngredients}
                onSelectIngredient={handleSelectIngredient} 
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};

export default DesktopLayout;
