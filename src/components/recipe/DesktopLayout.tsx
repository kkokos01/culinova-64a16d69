
import React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "@/components/recipe/RecipeHeader";
import RecipeContent from "@/components/recipe/RecipeContent";
import AIModificationPanel from "@/components/recipe/AIModificationPanel";
import ComparisonPanel from "@/components/recipe/ComparisonPanel";

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
  setSelectedIngredient
}) => {
  if (!recipe) return null;

  return (
    <ResizablePanelGroup 
      direction="horizontal" 
      className="h-[calc(100vh-64px)]"
    >
      {/* Left Panel - AI Modification Panel */}
      <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className="bg-gray-50">
        <div className="p-6 h-full overflow-y-auto flex flex-col">
          <div className="pt-16 pb-6 flex-1 overflow-y-auto">
            <AIModificationPanel 
              recipe={recipe}
              isOpen={true}
              onClose={() => {}}
              onStartModification={handleStartModification}
            />
          </div>
        </div>
      </ResizablePanel>
      
      <ResizableHandle withHandle className="transition-colors hover:bg-primary/20" />
      
      {/* Main Content */}
      <ResizablePanel defaultSize={50} minSize={40}>
        <div className="h-full overflow-y-auto bg-white">
          <div className="px-8 py-16 max-w-4xl mx-auto">
            <RecipeHeader 
              recipe={recipe}
              onModifyWithAI={handleModifyWithAI}
            />
            <RecipeContent 
              recipe={recipe}
              onSelectIngredient={setSelectedIngredient}
            />
          </div>
        </div>
      </ResizablePanel>
      
      <ResizableHandle withHandle className="transition-colors hover:bg-primary/20" />
      
      {/* Right Panel - Comparison Panel */}
      <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className="bg-gray-50">
        <div className="p-6 h-full overflow-y-auto flex flex-col">
          <div className="pt-16 pb-6 flex-1 overflow-y-auto">
            <ComparisonPanel 
              recipe={recipe}
              originalRecipe={recipe}
              selectedIngredient={selectedIngredient}
              isModified={isModified}
              onResetToOriginal={resetToOriginal}
              onAcceptChanges={handleAcceptChanges}
            />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default DesktopLayout;
