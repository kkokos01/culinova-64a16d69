
import React, { useState, useEffect } from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import UnifiedModificationPanel from "./UnifiedModificationPanel";
import RecipeVersionTabs from "./RecipeVersionTabs";
import { useRecipe } from "@/context/recipe";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChevronLeft, ChevronRight, Wand2 } from "lucide-react";
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
            className={`p-4 relative transition-all duration-300 ${
              leftPanelCollapsed 
                ? "bg-gradient-to-b from-purple-50 to-purple-100 border-r-2 border-purple-200" 
                : "bg-gradient-to-br from-purple-50 via-purple-100 to-blue-50 shadow-lg"
            }`}
          >
            {leftPanelCollapsed ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleToggleModifyPanel}
                  className="absolute top-4 right-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100/80"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="rotate-90 whitespace-nowrap text-base font-medium text-purple-700 flex items-center space-x-2">
                  <Wand2 className="h-4 w-4 transform -rotate-90 mr-2" />
                  <span>Recipe Modification</span>
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-purple-800">Modify Recipe</h2>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleToggleModifyPanel}
                    className="self-start text-purple-500 hover:text-purple-700 hover:bg-purple-100/80"
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
                      className="w-full border-purple-300 hover:bg-purple-50"
                    >
                      Reset to Original
                    </Button>
                    <Button 
                      onClick={handleAcceptModification}
                      className="w-full bg-purple-600 hover:bg-purple-700"
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
