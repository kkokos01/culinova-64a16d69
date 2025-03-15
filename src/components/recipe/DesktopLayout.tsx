
import React, { useState } from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import ComparisonPanel from "./ComparisonPanel";
import AIModificationPanel from "./AIModificationPanel";
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
    selectIngredientForModification, 
    removeIngredientSelection,
    setCustomInstructions
  } = useRecipe();
  
  // State for panel visibility
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove") => {
    setSelectedIngredient(ingredient);
    selectIngredientForModification(ingredient, action);
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
                </div>
              )}
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Main Content - Recipe */}
            <ResizablePanel defaultSize={60} className="bg-white p-4 overflow-y-auto">
              <RecipeContent 
                recipe={recipe} 
                selectedIngredients={selectedIngredients}
                onSelectIngredient={handleSelectIngredient} 
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel - Comparison */}
            <ResizablePanel 
              defaultSize={20} 
              minSize={rightPanelCollapsed ? 4 : 15} 
              maxSize={rightPanelCollapsed ? 4 : 30}
              collapsible
              collapsedSize={4}
              onCollapse={() => setRightPanelCollapsed(true)}
              onExpand={() => setRightPanelCollapsed(false)}
              className="bg-white p-4 relative"
            >
              {rightPanelCollapsed ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setRightPanelCollapsed(false)}
                    className="absolute top-4 left-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="rotate-90 whitespace-nowrap text-sm font-medium text-gray-500">
                    Recipe Details
                  </div>
                </div>
              ) : (
                <div className="overflow-y-auto h-full">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setRightPanelCollapsed(true)}
                    className="absolute top-4 left-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <ComparisonPanel
                    recipe={recipe}
                    originalRecipe={originalRecipe}
                    selectedIngredient={selectedIngredient}
                    isModified={isModified}
                    onResetToOriginal={resetToOriginal}
                    onAcceptChanges={handleAcceptChanges}
                  />
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </>
      )}
    </div>
  );
};

export default DesktopLayout;
