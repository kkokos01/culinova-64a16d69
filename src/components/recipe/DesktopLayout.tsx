
import React, { useState, useEffect } from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import RecipeVersionTabs from "./RecipeVersionTabs";
import { useRecipe } from "@/context/recipe";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChevronLeft, ChevronRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import UnifiedModificationPanel from "./UnifiedModificationPanel";
import { Card, CardHeader } from "@/components/ui/card";

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
  
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true);
  const [leftPanelSize, setLeftPanelSize] = useState(4);
  
  useEffect(() => {
    setLeftPanelSize(leftPanelCollapsed ? 4 : 35);
  }, [leftPanelCollapsed]);

  const handleToggleModifyPanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed);
  };

  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    onSelectIngredient(ingredient, action);
  };

  const handleAcceptModification = () => {
    if (recipe) {
      addRecipeVersion("Modified", recipe);
      handleAcceptChanges();
    }
  };

  const startUnifiedModification = () => {
    handleStartModification("unified");
  };

  return (
    <div className="container mx-auto py-4 px-4">
      {recipe && (
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-120px)] rounded-lg border">
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
              <div className="overflow-y-auto h-full">
                <Card className="rounded-none border-x-0 border-t-0 border-b border-white/20 shadow-none">
                  <CardHeader className="p-3 flex flex-row items-center justify-between">
                    <h2 className="text-lg font-semibold text-sage-600">Modify Recipe</h2>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleToggleModifyPanel}
                      className="text-sage-600 hover:text-sage-600 hover:bg-sage-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                </Card>
                
                <div className="p-4">
                  <p className="text-black mb-6">Customize this recipe with AI assistance</p>
                  
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
                        className="w-full border-white/30 text-white hover:bg-sage-600 hover:text-white"
                      >
                        Reset to Original
                      </Button>
                      <Button 
                        onClick={handleAcceptModification}
                        className="w-full bg-white text-sage-600 hover:bg-white/90 font-medium"
                      >
                        Save as New Version
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={65} className="bg-white overflow-y-auto">
            <div className="p-5">
              <RecipeHeader
                recipe={recipe}
                isModified={isModified}
                onModifyWithAI={handleToggleModifyPanel}
                showModifyButton={leftPanelCollapsed}
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
